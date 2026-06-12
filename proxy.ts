import { NextResponse } from 'next/server';

// ✅ Parameter 'req' dihapus karena tidak lagi digunakan
export async function proxy() {
  // PENGABAIAN MIDDLEWARE SERVER
  // Karena autentikasi Warhope Apparel berpusat pada Zustand (Local Storage),
  // pengecekan cookie di sisi server (proxy) dimatikan agar tidak terjadi tabrakan rute (Redirect Loop).
  // Seluruh proteksi keamanan diserahkan kepada layout.jsx di masing-masing folder.
  
  return NextResponse.next();
}

export const config = {
  // Kosongkan matcher agar proxy ini tidak mencegat halaman apa pun
  matcher: [], 
};