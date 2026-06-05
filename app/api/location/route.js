import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, id, search } = body;

    const apiKey = process.env.KIRIMINAJA_API_KEY;
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction ? 'https://client.kiriminaja.com' : 'https://tdev.kiriminaja.com';

    let endpoint = '';
    let fetchOptions = {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    };

    // 1. ROUTING BERDASARKAN ACTION
    if (action === 'provinces') {
      endpoint = '/api/mitra/v3/province'; // Sesuaikan path jika berbeda di dashboard KiriminAja
      fetchOptions.body = JSON.stringify({});
    } 
    else if (action === 'cities') {
      endpoint = '/api/mitra/v3/city'; // Sesuaikan path
      fetchOptions.body = JSON.stringify({ provinsi_id: parseInt(id) });
    } 
    else if (action === 'districts') {
      endpoint = '/api/mitra/v3/district'; // Sesuaikan path
      fetchOptions.body = JSON.stringify({ kabupaten_id: parseInt(id) });
    } 
    else if (action === 'subdistricts') {
      endpoint = '/api/mitra/v3/subdistrict'; // Sesuaikan path
      fetchOptions.body = JSON.stringify({ kecamatan_id: parseInt(id) });
    } 
    else if (action === 'search_subdistrict') {
      // PENTING: Sesuai dokumen, pencarian kelurahan adalah GET
      endpoint = `/api/mitra/v3/search_kelurahan?search=${encodeURIComponent(search)}`; // Sesuaikan path
      fetchOptions = {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${apiKey}` }
      };
    } 
    else {
      return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
    }

    // 2. FETCH KE KIRIMINAJA
    const response = await fetch(`${baseUrl}${endpoint}`, fetchOptions);
    const data = await response.json();

    if (!response.ok || !data.status) {
      throw new Error(data.text || 'Gagal mengambil data dari penyedia logistik');
    }

    // 3. NORMALISASI RESPONSE (Karena KiriminAja merespons dengan key yang berbeda-beda: datas, results, data)
    let finalData = [];
    if (data.datas) finalData = data.datas;
    else if (data.results) finalData = data.results;
    else if (data.data) finalData = data.data;

    return NextResponse.json(finalData);

  } catch (error) {
    console.error(`Error Location API [${body?.action}]:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}