import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // 1. Ambil token/sesi Supabase dari cookies
  const supabaseSession = req.cookies.get('sb-access-token')?.value || req.cookies.get('supabase-auth-token')?.value;

  // 2. Proteksi Halaman Admin
  if (pathname.startsWith('/admin')) {
    // Jika tidak ada sesi login sama sekali, lempar ke halaman login
    if (!supabaseSession) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    try {
      // Decode JWT token secara manual
      const tokenParts = supabaseSession.split('.');
      if (tokenParts.length !== 3) throw new Error("Token tidak valid");

      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      
      const userRole = payload.app_metadata?.role || payload.user_metadata?.role || 'customer';

      // ✅ PERBAIKAN: Gunakan array untuk mengecek semua varian role admin
      const allowedAdminRoles = ['admin', 'admin_staff', 'superadmin'];
      
      // Jika role (dalam huruf kecil) tidak ada di daftar yang diizinkan, lempar ke beranda
      if (!allowedAdminRoles.includes(userRole.toLowerCase())) {
        return NextResponse.redirect(new URL('/', req.url));
      }

    } catch (error) {
      console.error("Middleware Error:", error);
      // Jika token rusak/kadaluarsa, paksa login ulang
      req.cookies.delete('sb-access-token');
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }

  // 3. Proteksi Halaman Auth
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