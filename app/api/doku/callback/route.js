import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ✅ WAJIB ADA: Mencegah Next.js mengevaluasi file ini secara statis saat proses build (npm run build)
export const dynamic = 'force-dynamic';

export async function POST(req) {
  // 🔥 INISIALISASI DIPINDAH KE DALAM SINI: 
  // Vercel tidak akan membaca ini saat proses build, hanya saat API benar-benar dipanggil
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Proteksi ganda jika environment belum siap saat runtime
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("CRITICAL ERROR: Supabase URL atau Service Key tidak ditemukan di environment variables!");
    return NextResponse.json({ error: "Konfigurasi server tidak lengkap" }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const rawBody = await req.text(); 
    const body = JSON.parse(rawBody); 
    
    const clientId = req.headers.get('client-id');
    const requestId = req.headers.get('request-id');
    const requestTimestamp = req.headers.get('request-timestamp');
    const signatureFromDoku = req.headers.get('signature');

    const secretKey = process.env.DOKU_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Secret Key DOKU tidak dikonfigurasi" }, { status: 500 });
    }

    // --- VALIDASI SIGNATURE ---
    const digestHash = crypto.createHash('sha256').update(rawBody).digest('base64');
    const targetPath = '/api/doku/callback'; 
    const componentSignature = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${targetPath}\nDigest:${digestHash}`;
    const calculatedHmac = crypto.createHmac('sha256', secretKey).update(componentSignature).digest('base64');
    const calculatedSignature = `HMACSHA256=${calculatedHmac}`;

    if (signatureFromDoku !== calculatedSignature) {
      console.warn("Peringatan: Signature DOKU tidak valid!", { expected: calculatedSignature, received: signatureFromDoku });
      // Di Production, buka komentar baris di bawah ini untuk menolak request palsu
      // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let invoiceNumber = null;
    let paymentStatus = null;

    if (body.order && body.order.invoice_number) {
        invoiceNumber = body.order.invoice_number;
    }
    
    if (body.transaction && body.transaction.status) {
        paymentStatus = body.transaction.status.toUpperCase(); 
    }

    if (!invoiceNumber) {
        return NextResponse.json({ error: "Invoice Number tidak ditemukan" }, { status: 400 });
    }

    console.log(`Webhook DOKU: Invoice ${invoiceNumber} | Status ${paymentStatus}`);

    // --- UPDATE STATUS KE SUPABASE ---
    if (paymentStatus === 'SUCCESS') {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .update({ status: 'paid' }) 
            .eq('invoice_number', invoiceNumber) 
            .select()
            .single(); 

        if (error) {
            console.error(`Gagal update DB untuk ${invoiceNumber}:`, error);
            return NextResponse.json({ error: "Gagal update database" }, { status: 500 });
        }
        
        console.log(`Berhasil update ${invoiceNumber} menjadi 'paid'`);

        // --- PENGIRIMAN EMAIL OTOMATIS ---
        if (data && data.customer_email) {
          try {
            const baseUrl = process.env.VERCEL_URL 
              ? `https://${process.env.VERCEL_URL}` 
              : 'http://localhost:3000';
            
            await fetch(`${baseUrl}/api/send-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: data.customer_email,
                subject: `Pembayaran Berhasil - Invoice ${data.invoice_number}`,
                type: 'PAID',
                orderData: data
              })
            });
            console.log(`Email konfirmasi LUNAS dikirim ke ${data.customer_email}`);
          } catch (emailErr) {
            console.error("Gagal menembak API Email:", emailErr);
          }
        }

    } else if (paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED') {
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({ status: paymentStatus.toLowerCase() }) // 'failed' atau 'expired'
            .eq('invoice_number', invoiceNumber);

        if (updateError) {
            console.error(`Gagal update DB FAILED/EXPIRED untuk ${invoiceNumber}:`, updateError);
        }
    }

    return NextResponse.json({ message: "Notifikasi berhasil diproses" }, { status: 200 });

  } catch (error) {
    console.error("Kesalahan Webhook Callback:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
  }
}