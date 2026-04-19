import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase khusus untuk Back-end
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const body = await req.json();
    // PERBAIKAN: Menghapus variabel 'total' yang tidak dipakai
    const { formData, items, shippingCost, adminFee } = body;

    const clientId = process.env.DOKU_CLIENT_ID;
    const secretKey = process.env.DOKU_SECRET_KEY;
    const baseUrl = process.env.DOKU_API_URL || 'https://api-sandbox.doku.com';
    const targetPath = '/checkout/v1/payment';
    const url = `${baseUrl}${targetPath}`;

    if (!clientId || !secretKey) {
      return NextResponse.json({ error: "Konfigurasi server DOKU belum lengkap" }, { status: 500 });
    }

    const requestId = uuidv4(); 
    const timestamp = new Date().toISOString().slice(0, 19) + "Z"; 
    const invoiceNumber = `INVWH${Date.now()}`; 
    const originUrl = req.headers.get('origin') || 'http://localhost:3000';

    // 1. Susun Line Items untuk DOKU
    const lineItems = items.map((item, index) => ({
      id: item.id || `ITEM-${index}`,
      name: item.name.substring(0, 255),
      price: Math.round(item.price),
      quantity: item.quantity,
      sku: item.id || `SKU-${index}`,
      category: "clothing",
      url: `${originUrl}/product/${item.id}`
    }));

    if (shippingCost > 0) {
      lineItems.push({
        id: 'FEE-SHIPPING', name: 'Biaya Pengiriman', price: Math.round(shippingCost), quantity: 1, sku: 'SHIPPING', category: 'services'
      });
    }

    if (adminFee > 0) {
      lineItems.push({
        id: 'FEE-ADMIN', name: 'Biaya Admin Sistem', price: Math.round(adminFee), quantity: 1, sku: 'ADMIN', category: 'fee'
      });
    }

    // Hitung total manual dari line items agar presisi dengan standar DOKU
    const calculatedTotal = lineItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const requestBody = {
      order: {
        amount: calculatedTotal, 
        invoice_number: invoiceNumber,
        currency: "IDR",
        callback_url: `${originUrl}/success`,
        auto_redirect: true,
        line_items: lineItems
      },
      payment: { payment_due_date: 60 },
      customer: {
        id: `CUST-${formData.email.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}`,
        name: formData.firstName.substring(0, 255),
        last_name: formData.lastName ? formData.lastName.substring(0, 16) : undefined,
        email: formData.email,
        phone: formData.phone || "080000000000",
        address: formData.address.substring(0, 400),
        postcode: formData.zip || "00000",
        state: formData.state || "Indonesia",
        city: formData.city || "Kota",
        country: "ID"
      }
    };

    const requestBodyString = JSON.stringify(requestBody);
    const digestHash = crypto.createHash('sha256').update(requestBodyString).digest('base64');
    const componentSignature = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${targetPath}\nDigest:${digestHash}`;
    const hmacSignature = crypto.createHmac('sha256', secretKey).update(componentSignature).digest('base64');
    const finalSignature = `HMACSHA256=${hmacSignature}`;

    // Tembak API DOKU
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Client-Id': clientId,
        'Request-Id': requestId,
        'Request-Timestamp': timestamp,
        'Signature': finalSignature,
        'Content-Type': 'application/json'
      },
      body: requestBodyString
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("DOKU API Error Details:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: "Gagal membuat sesi pembayaran DOKU", details: data }, { status: response.status });
    }

    // =========================================================================
    // PROSES SIMPAN PESANAN KE SUPABASE DENGAN LOGGING DETAIL
    // =========================================================================
    
    const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`;

    console.log("-----------------------------------------");
    console.log("▶️ MEMULAI PROSES SIMPAN KE SUPABASE...");
    console.log("Data Invoice:", invoiceNumber);
    console.log("Total Amount:", calculatedTotal);
    
    // Coba simpan ke database
    const { error: dbError } = await supabase
      .from('orders')
      .insert([
        {
          invoice_number: invoiceNumber,
          customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
          customer_email: formData.email,
          customer_phone: formData.phone || "Tidak diisi",
          shipping_address: fullAddress,
          total_amount: calculatedTotal,
          status: 'PENDING',
          items: items 
        }
      ]);

    if (dbError) {
      console.error("❌ GAGAL MENYIMPAN KE SUPABASE! Detail Error:");
      console.error(JSON.stringify(dbError, null, 2));
      console.log("💡 Saran: Cek apakah RLS (Row Level Security) tabel 'orders' sudah dimatikan.");
    } else {
      console.log("✅ BERHASIL MENYIMPAN KE TABEL ORDERS!");
    }
    console.log("-----------------------------------------");

    // =========================================================================

    return NextResponse.json({ 
      payment_url: data.response.payment.url, 
      order_id: invoiceNumber 
    });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem internal server" }, { status: 500 });
  }
}