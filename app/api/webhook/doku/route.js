import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../../lib/supabase'; // Pastikan path ini benar

export async function POST(req) {
  try {
    const clientId = req.headers.get('client-id');
    const requestId = req.headers.get('request-id');
    const requestTimestamp = req.headers.get('request-timestamp');
    const signatureHeader = req.headers.get('signature'); 
    
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    const secretKey = process.env.DOKU_SECRET_KEY || '';
    if (secretKey && signatureHeader) {
      const digest = crypto.createHash('sha256').update(rawBody, 'utf8').digest('base64');
      const requestTarget = '/api/webhook/doku'; 
      const signatureString = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;
      
      const expectedSignature = crypto.createHmac('sha256', secretKey).update(signatureString).digest('base64');
      const finalExpectedSignature = `HMACSHA256=${expectedSignature}`;

      if (signatureHeader !== finalExpectedSignature) {
        console.error("🚨 Invalid Webhook Signature!");
        return NextResponse.json({ error: "Unauthorized. Signature mismatch." }, { status: 401 });
      }
    }

    const invoiceNumber = body?.order?.invoice_number;
    const paymentStatus = body?.transaction?.status; // 'SUCCESS', 'FAILED', atau 'EXPIRED' dari DOKU

    if (!invoiceNumber || !paymentStatus) {
      return NextResponse.json({ error: "Payload tidak lengkap." }, { status: 400 });
    }

    // Ambil Data Order dan Items-nya (Kita butuh Items untuk mengembalikan stok jika gagal)
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        id, 
        status,
        order_items ( product_id, quantity, selected_size )
      `)
      .eq('invoice_number', invoiceNumber)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    if (orderData.status === 'PAID' || orderData.status === 'PROCESSING' || orderData.status === 'SHIPPED' || orderData.status === 'COMPLETED' || orderData.status === 'FAILED' || orderData.status === 'EXPIRED') {
      return NextResponse.json({ message: "Status pesanan sudah final. Webhook diabaikan." }, { status: 200 });
    }

    // ==========================================
    // SKENARIO 1: PEMBAYARAN BERHASIL
    // ==========================================
    if (paymentStatus === 'SUCCESS') {
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ status: 'PAID' })
        .eq('invoice_number', invoiceNumber);

      if (updateError) throw updateError;
      return NextResponse.json({ message: "Pesanan dibayar (PAID)." }, { status: 200 });
    } 

    // ==========================================
    // SKENARIO 2: PEMBAYARAN GAGAL / EXPIRED
    // ==========================================
    else if (paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED') {
      
      // A. Ubah status pesanan menjadi Failed/Expired
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ status: paymentStatus })
        .eq('invoice_number', invoiceNumber);
      
      if (updateError) throw updateError;

      // B. KEMBALIKAN STOK BARANG (Rollback)
      // Kita panggil manual di sini menggunakan RPC karena ini backend Node.js
      if (orderData.order_items && orderData.order_items.length > 0) {
        for (const item of orderData.order_items) {
           // RPC increment ini kebalikan dari decrement yang kita buat sebelumnya.
           // Kita perlu membuat fungsi RPC baru 'checkout_increment_stock' di Supabase.
           await supabaseAdmin.rpc('checkout_increment_stock', {
             p_product_id: item.product_id,
             p_size: item.selected_size,
             p_quantity: item.quantity
           });
        }
      }

      return NextResponse.json({ message: `Pesanan ${paymentStatus}. Stok dikembalikan.` }, { status: 200 });
    }

    return NextResponse.json({ message: "Status tidak dikenali, diabaikan." }, { status: 200 });

  } catch (error) {
    console.error("Error Webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}