"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, Menu, X, Heart } from 'lucide-react';

import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useAuthStore } from '../store/authStore';
import { getAllProducts } from '../lib/api';

export default function Navbar() {
  const pathname = usePathname();
  
  const items = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore((state) => state.wishlist); 
  const syncWishlistFromDB = useWishlistStore((state) => state.syncWishlistFromDB);

  const { user, isInitialized } = useAuthStore();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ✅ DETEKSI TINGKAT ADMIN
  const userRole = user?.role?.toLowerCase();
  const isAdminLevel = userRole === 'superadmin' || userRole === 'admin_staff' || userRole === 'admin';

  // Deteksi Scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pengambilan produk HANYA untuk Sinkronisasi Wishlist
  useEffect(() => {
    const fetchProductsAndSync = async () => {
      const data = await getAllProducts();
      if (user?.email && data?.length > 0) {
        syncWishlistFromDB(user.email, data);
      }
    };

    if (isInitialized && user) {
      fetchProductsAndSync();
    }
  }, [user, isInitialized, syncWishlistFromDB]);

  // Kunci scroll body saat menu mobile terbuka
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  // Tutup menu mobile saat pindah rute
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMobileMenuOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Jika masuk ke halaman admin, sembunyikan navbar toko ini
  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          
          <Link href="/" className="flex items-center gap-2 z-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/warhope-clear.PNG" alt="Warhope Logo" className="h-7 md:h-8 w-auto object-contain dark:invert transition-transform hover:scale-105" />
          </Link>

          {/* NAV MENU UTAMA (TEXT LINKS) */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link 
              href="/" 
              className={`text-sm font-bold transition-colors ${pathname === '/' ? 'text-blue-600 dark:text-blue-400' : 'text-foreground/70 hover:text-foreground'}`}
            >
              Beranda
            </Link>
            <Link 
              href="/katalog" 
              className={`text-sm font-bold transition-colors ${pathname === '/katalog' ? 'text-blue-600 dark:text-blue-400' : 'text-foreground/70 hover:text-foreground'}`}
            >
              Katalog
            </Link>
            <Link 
              href="/about" 
              className={`text-sm font-bold transition-colors ${pathname === '/about' ? 'text-blue-600 dark:text-blue-400' : 'text-foreground/70 hover:text-foreground'}`}
            >
              Tentang Kami
            </Link>
          </div>

          {/* NAV UTAMA BELAKANG (ICON BUTTONS) */}
          <div className="flex items-center gap-2 sm:gap-4 z-50">
            
            {/* SINKRONISASI AKTIF: WISHLIST */}
            {isInitialized && user && (
              <Link 
                href="/wishlist" 
                className={`relative p-2 transition-colors rounded-full hidden sm:block ${pathname === '/wishlist' ? 'text-red-500 bg-red-50 dark:bg-red-950/30' : 'text-foreground/70 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Heart className={`w-5 h-5 ${pathname === '/wishlist' ? 'fill-current' : ''}`} />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>
            )}

            {/* SINKRONISASI AKTIF: PROFILE / ACCOUNT */}
            {isInitialized && (
              user ? (
                <Link 
                  // ✅ UPDATE: Gunakan isAdminLevel untuk mengarahkan ke halaman yang benar
                  href={isAdminLevel ? '/admin' : '/profile'} 
                  className={`p-2 transition-colors rounded-full hidden sm:block ${pathname === '/profile' ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' : 'text-foreground/70 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <User className="w-5 h-5" />
                </Link>
              ) : (
                <Link 
                  href="/auth/login" 
                  className={`text-xs font-bold px-4 py-2 rounded-full transition-all hidden sm:block ${pathname === '/auth/login' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-blue-600 hover:text-white'}`}
                >
                  Masuk
                </Link>
              )
            )}

            {/* SINKRONISASI AKTIF: KERANJANG CART */}
            <Link 
              href="/cart" 
              className={`relative p-2 transition-colors rounded-full ${pathname === '/cart' ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' : 'text-foreground/70 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <ShoppingBag className="w-5 h-5" />
              {items.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                  {items.length}
                </span>
              )}
            </Link>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-foreground/70 hover:text-foreground md:hidden rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU SINKRONISASI AKTIF */}
      <div className={`md:hidden fixed inset-0 z-40 bg-white dark:bg-slate-900 transition-transform duration-300 flex flex-col pt-24 px-6 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col gap-6 text-xl font-bold text-foreground">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className={pathname === '/' ? 'text-blue-600' : ''}>Beranda</Link>
          <Link href="/katalog" onClick={() => setIsMobileMenuOpen(false)} className={pathname === '/katalog' ? 'text-blue-600' : ''}>Katalog Produk</Link>
          <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className={pathname === '/about' ? 'text-blue-600' : ''}>Tentang Kami</Link>
          {user && <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center justify-between ${pathname === '/wishlist' ? 'text-red-500' : ''}`}>Wishlist Saya {wishlistItems.length > 0 && <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full">{wishlistItems.length}</span>}</Link>}
          <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center justify-between ${pathname === '/cart' ? 'text-blue-600' : ''}`}>Keranjang Belanja {items.length > 0 && <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">{items.length}</span>}</Link>
        </div>
        <div className="mt-auto pb-8 pt-8 border-t border-slate-100 dark:border-slate-800">
          {isInitialized && user ? (
            <Link 
              // ✅ UPDATE: Gunakan isAdminLevel untuk mengarahkan ke halaman yang benar di versi mobile
              href={isAdminLevel ? '/admin' : '/profile'} 
              onClick={() => setIsMobileMenuOpen(false)} 
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold w-full ${pathname === '/profile' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800 text-foreground'}`}
            >
              <User className="w-5 h-5" /> {isAdminLevel ? 'Panel Admin' : 'Akun Saya'}
            </Link>
          ) : (
            <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-bold w-full shadow-lg shadow-blue-600/20 active:scale-95 transition-transform">
              <User className="w-5 h-5" /> Masuk / Daftar
            </Link>
          )}
        </div>
      </div>
    </>
  );
}