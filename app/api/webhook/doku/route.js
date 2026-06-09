import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../../lib/supabase'; // Pastikan path ini benar

export async function POST(req) {
  try {
    // 1. AMBIL HEADERS UNTUK VALIDASI KEAMANAN DOKU
    const clientId = req.headers.get('client-id');
    const requestId = req.headers.get('request-id');
    const requestTimestamp = req.headers.get('request-timestamp');
    const signatureHeader = req.headers.get('signature'); // Contoh format: HMACSHA256=...
    
    // Ambil raw body text untuk validasi signature (jangan di-parse JSON dulu)
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // 2. VALIDASI SIGNATURE JOKUL DOKU (Keamanan Level Bank)
    const secretKey = process.env.DOKU_SECRET_KEY || '';
    if (secretKey && signatureHeader) {
      // Buat Digest (Base64 dari SHA256 raw body)
      const digest = crypto.createHash('sha256').update(rawBody, 'utf8').digest('base64');
      
      // Susun komponen signature sesuai standar DOKU
      const requestTarget = '/api/webhook/doku'; // Sesuaikan dengan path endpoint Anda di Doku Dashboard
      const signatureString = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;
      
      // Generate HMAC
      const expectedSignature = crypto.createHmac('sha256', secretKey).update(signatureString).digest('base64');
      const finalExpectedSignature = `HMACSHA256=${expectedSignature}`;

      if (signatureHeader !== finalExpectedSignature) {
        console.error("🚨 Invalid Webhook Signature!");
        return NextResponse.json({ error: "Unauthorized. Signature mismatch." }, { status: 401 });
      }
    }

    const invoiceNumber = body?.order?.invoice_number;
    if (!invoiceNumber) {
      return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
    }

    // 3. IDEMPOTENCY CHECK (Cek Status Pesanan Saat Ini)
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('invoice_number', invoiceNumber)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    // Jika sudah dibayar atau diproses, hentikan agar tidak ada update redundant
    if (orderData.status === 'PAID' || orderData.status === 'PROCESSING' || orderData.status === 'SHIPPED' || orderData.status === 'COMPLETED') {
      return NextResponse.json({ message: "Pesanan sudah diproses sebelumnya. Webhook diabaikan." }, { status: 200 });
    }

    // 4. UPDATE STATUS PESANAN JADI 'PAID'
    // Logika pemotongan stok dihapus dari sini karena sudah ditangani saat Checkout (createOrder).
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'PAID' })
      .eq('invoice_number', invoiceNumber);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ message: "Webhook berhasil diproses. Status pesanan menjadi PAID." }, { status: 200 });

  } catch (error) {
    console.error("Error Webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}