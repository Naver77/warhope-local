import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // 1. Ambil token/sesi Supabase dari cookies
  const supabaseSession = req.cookies.get('sb-access-token')?.value || req.cookies.get('supabase-auth-token')?.value;

  // 2. Proteksi Halaman Admin (Hanya cek Autentikasi)
  if (pathname.startsWith('/admin')) {
    // Jika tidak ada sesi login sama sekali, lempar ke halaman login
    if (!supabaseSession) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    // PENJELASAN: Kita tidak mengecek 'role' di sini karena token JWT Supabase 
    // standar tidak memuat role dari tabel public.users. 
    // Pengecekan role akan dilakukan di sisi client (app/admin/layout.jsx).
  }

  // 3. Proteksi Halaman Auth (Mencegah user login masuk ke halaman login lagi)
  if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')) {
    if (supabaseSession) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/auth/:path*'],
};