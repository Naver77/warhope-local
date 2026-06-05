import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../../lib/supabase'; // Menggunakan Admin Client!

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
      const requestTarget = '/api/webhook/doku'; // Sesuaikan dengan path endpoint ini di Doku Dashboard
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

    // 3. IDEMPOTENCY CHECK (Cegah Eksekusi Ganda)
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('invoice_number', invoiceNumber)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    // Jika sudah dibayar sebelumnya, hentikan proses (jangan potong stok lagi)
    if (orderData.status === 'PAID') {
      return NextResponse.json({ message: "Pesanan sudah lunas sebelumnya. Webhook diabaikan." }, { status: 200 });
    }

    // 4. UPDATE STATUS PESANAN JADI 'PAID'
    await supabaseAdmin
      .from('orders')
      .update({ status: 'PAID' })
      .eq('invoice_number', invoiceNumber);

    // 5. PEMOTONGAN STOK FISIK OTOMATIS
    // Karena kolom 'items' adalah jsonb, Supabase biasanya sudah mengembalikan sebagai Object
    let items = typeof orderData.items === 'string' ? JSON.parse(orderData.items) : orderData.items;

    for (const item of items) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('sizes')
        .eq('id', item.id)
        .single();

      if (product && product.sizes) {
        let sizesMatrix = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;

        if (sizesMatrix[item.selectedSize]) {
          const currentStock = sizesMatrix[item.selectedSize].stock || 0;
          sizesMatrix[item.selectedSize].stock = Math.max(0, currentStock - item.quantity);

          await supabaseAdmin
            .from('products')
            .update({ sizes: sizesMatrix })
            .eq('id', item.id);
        }
      }
    }

    return NextResponse.json({ message: "Webhook berhasil diproses & Stok diperbarui." }, { status: 200 });

  } catch (error) {
    console.error("Error Webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}