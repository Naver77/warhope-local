import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    // Menyesuaikan dengan parameter dari checkout/page.jsx yang baru
    const { formData, items, shippingCost } = body;

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

    const lineItems = items.map((item, index) => {
      // PERBAIKAN: Ambil harga final setelah diskon. Gunakan fallback harga asli jika tidak ada.
      const itemFinalPrice = Number(item.finalPrice ?? item.final_price ?? item.price);
      
      return {
        id: item.id || `ITEM-${index}`,
        name: item.name.substring(0, 255),
        price: Math.round(itemFinalPrice), // Gunakan harga final di sini
        quantity: item.quantity,
        sku: item.id || `SKU-${index}`,
        category: "clothing",
        url: `${originUrl}/product/${item.id}`
      };
    });

    if (shippingCost > 0) {
      lineItems.push({
        id: 'FEE-SHIPPING', name: 'Biaya Pengiriman', price: Math.round(shippingCost), quantity: 1, sku: 'SHIPPING', category: 'services'
      });
    }

    // Hitung total manual dari line items agar presisi dengan standar DOKU
    const calculatedTotal = lineItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // 2. Format Request Body DOKU
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
        // address sekarang menampung fullAddressText dari frontend
        address: formData.address.substring(0, 400), 
        postcode: formData.zipCode || "00000", // Menggunakan zipCode sesuai frontend
        country: "ID"
      }
    };

    const requestBodyString = JSON.stringify(requestBody);
    const digestHash = crypto.createHash('sha256').update(requestBodyString).digest('base64');
    const componentSignature = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${targetPath}\nDigest:${digestHash}`;
    const hmacSignature = crypto.createHmac('sha256', secretKey).update(componentSignature).digest('base64');
    const finalSignature = `HMACSHA256=${hmacSignature}`;

    // 3. Tembak API DOKU
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

    // Blok insert Supabase dihapus agar tidak terjadi duplikasi pesanan 
    // dengan fungsi createOrder di halaman checkout.

    return NextResponse.json({ 
      payment_url: data.response.payment.url, 
      order_id: invoiceNumber 
    });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem internal server" }, { status: 500 });
  }
}