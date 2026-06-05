import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { destination_district_id, weight, item_value } = body;

    // AMBIL DARI ENV (Tidak ada lagi hardcode)
    const ORIGIN_DISTRICT_ID = process.env.STORE_ORIGIN_DISTRICT_ID; 

    if (!ORIGIN_DISTRICT_ID) {
      throw new Error("ID Kecamatan Asal (Gudang) belum diatur di server.");
    }

    const apiKey = process.env.KIRIMINAJA_API_KEY;
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction ? 'https://client.kiriminaja.com' : 'https://tdev.kiriminaja.com';

    const response = await fetch(`${baseUrl}/api/mitra/v2/shipping_price`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        origin: parseInt(ORIGIN_DISTRICT_ID),
        destination: parseInt(destination_district_id),
        weight: weight || 500,
        item_value: item_value ? String(item_value) : "0", 
        insurance: 0
      })
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      throw new Error(data.text || 'Gagal mengambil tarif pengiriman');
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Error Fetching Shipping:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}