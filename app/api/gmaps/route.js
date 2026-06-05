// app/api/gmaps/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url || !url.includes('maps')) {
      return NextResponse.json({ error: "Link Google Maps tidak valid" }, { status: 400 });
    }

    // Server-side fetch untuk menghindari CORS browser dan mengikuti redirect shortlink
    const response = await fetch(url, { redirect: 'follow' });
    const html = await response.text();

    // Google Maps biasanya menyimpan alamat lengkap di dalam tag <meta property="og:description"> atau <title>
    const match = html.match(/<meta property="og:description" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
    
    let addressText = match ? match[1] : '';

    // Membersihkan teks (Google kadang menambahkan nama tempat di depannya, pisahkan dengan koma)
    if (!addressText) {
       return NextResponse.json({ error: "Gagal mengekstrak alamat dari link tersebut" }, { status: 404 });
    }

    return NextResponse.json({ address: addressText });

  } catch (error) {
    console.error("Gmaps Parser Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}