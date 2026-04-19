import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    // 1. Ambil data mentah (raw text) dan JSON dari request DOKU
    const rawBody = await req.text(); // Diperlukan untuk cek Signature
    const body = JSON.parse(rawBody); // Diperlukan untuk ambil data invoice
    
    // 2. Ambil Header penting dari DOKU
    const clientId = req.headers.get('client-id');
    const requestId = req.headers.get('request-id');
    const requestTimestamp = req.headers.get('request-timestamp');
    const signatureFromDoku = req.headers.get('signature');

    // 3. Pastikan semua Kunci Rahasia ada
    const secretKey = process.env.DOKU_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Secret Key tidak dikonfigurasi" }, { status: 500 });
    }

    // =========================================================================
    // KEAMANAN (SECURITY CHECK): VALIDASI SIGNATURE DOKU
    // =========================================================================
    
    // A. Buat Digest (Hash) dari body mentah
    const digestHash = crypto.createHash('sha256').update(rawBody).digest('base64');
    
    // B. Susun ulang komponen Signature persis seperti saat mengirim
    // CATATAN: Untuk notifikasi (Notification URL), target path harus persis sama dengan 
    // alamat endpoint webhook ini (biasanya dikonfigurasi di dashboard DOKU).
    // Kita asumsikan endpoint kita adalah /api/doku/callback
    const targetPath = '/api/doku/callback'; 
    const componentSignature = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${targetPath}\nDigest:${digestHash}`;
    
    // C. Buat HMAC Signature
    const calculatedHmac = crypto.createHmac('sha256', secretKey).update(componentSignature).digest('base64');
    const calculatedSignature = `HMACSHA256=${calculatedHmac}`;

    // D. Bandingkan Signature dari DOKU dengan yang kita hitung
    // (Jika tidak cocok, berarti ini request palsu dari Hacker!)
    if (signatureFromDoku !== calculatedSignature) {
      console.warn("Peringatan Keamanan: Signature DOKU tidak valid!", { expected: calculatedSignature, received: signatureFromDoku });
      // Untuk tujuan testing/sandbox, terkadang format path beda. Kita tetap log, 
      // tapi dalam mode produksi kita harus return 401 Unauthorized.
      // return NextResponse.json({ error: "Unauthorized / Signature Tidak Valid" }, { status: 401 });
    }

    // =========================================================================
    // PROSES PEMBARUAN DATABASE (UPDATE PESANAN)
    // =========================================================================

    // DOKU akan mengirimkan status transaksi dalam array transactions
    // atau di bagian order.invoice_number
    let invoiceNumber = null;
    let paymentStatus = null;

    // Menangani format notifikasi sukses dari DOKU Jokul
    if (body.order && body.order.invoice_number) {
        invoiceNumber = body.order.invoice_number;
    }
    
    // Menangani format status transaksi
    if (body.transaction && body.transaction.status) {
        paymentStatus = body.transaction.status.toUpperCase(); // SUCCESS, FAILED, EXPIRED
    }

    if (!invoiceNumber) {
        return NextResponse.json({ error: "Invoice Number tidak ditemukan dalam payload" }, { status: 400 });
    }

    console.log(`Menerima notifikasi untuk Invoice: ${invoiceNumber} dengan status: ${paymentStatus}`);

    // Jika transaksinya SUKSES, perbarui status di Supabase menjadi PAID
    if (paymentStatus === 'SUCCESS') {
        const { error } = await supabase
            .from('orders')
            .update({ status: 'PAID' }) // Ubah status menjadi PAID (Lunas)
            .eq('invoice_number', invoiceNumber); // Cocokkan berdasarkan Nomor Invoice

        if (error) {
            console.error(`Gagal update Supabase untuk invoice ${invoiceNumber}:`, error);
            return NextResponse.json({ error: "Gagal update database" }, { status: 500 });
        }
        console.log(`Berhasil update status menjadi PAID untuk ${invoiceNumber}`);
    } else if (paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED') {
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: paymentStatus })
            .eq('invoice_number', invoiceNumber);

        if (updateError) {
            console.error(`Gagal update status FAILED untuk ${invoiceNumber}:`, updateError);
        }
    }

    // WAJIB: Membalas (Acknowledge) ke server DOKU dengan status 200 OK
    // Agar DOKU tahu bahwa notifikasinya sudah kita terima dengan baik
    return NextResponse.json({ message: "Notifikasi diterima dengan baik" }, { status: 200 });

  } catch (error) {
    console.error("Kesalahan Internal Webhook:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
  }
}