"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, Search, Menu, X, ArrowRight } from 'lucide-react';

import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { getAllProducts } from '../lib/api';

export default function Navbar() {
  const pathname = usePathname();
  
  const items = useCartStore((state) => state.items);
  const { user, isInitialized } = useAuthStore();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- STATE UNTUK FITUR PENCARIAN ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);

  // Deteksi Scroll untuk efek Navbar transparan -> Solid
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mengambil data produk untuk Live Search saat komponen dimuat
  useEffect(() => {
    const fetchProductsForSearch = async () => {
      const data = await getAllProducts();
      setProducts(data || []);
    };
    fetchProductsForSearch();
  }, []);

  // PERBAIKAN LINTER: Menggunakan useMemo alih-alih useEffect + setState
  // Ini menghindari error "cascading renders" dan jauh lebih efisien
  const searchResults = useMemo(() => {
    if (searchQuery.trim() === '') return [];
    
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  }, [searchQuery, products]);

  // Kunci scroll body saat Search atau Menu Mobile terbuka
  useEffect(() => {
    if (isSearchOpen || isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isSearchOpen, isMobileMenuOpen]);

  // Otomatis tutup search & menu saat pindah halaman
  // PERBAIKAN LINTER: Menggunakan setTimeout agar setState tidak sinkron dengan render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
      setSearchQuery('');
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  // Jangan tampilkan Navbar bawaan ini jika sedang di Halaman Admin
  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          
          {/* BAGIAN KIRI: Logo */}
          <Link href="/" className="flex items-center gap-2 z-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/assets/warhope-clear.PNG" 
              alt="Warhope Logo" 
              className="h-7 md:h-8 w-auto object-contain dark:invert transition-transform hover:scale-105" 
            />
          </Link>

          {/* BAGIAN TENGAH: Menu Desktop */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link href="/" className={`text-sm font-bold transition-colors ${pathname === '/' ? 'text-blue-600 dark:text-blue-400' : 'text-foreground/70 hover:text-foreground'}`}>Beranda</Link>
            <Link href="/#katalog" className={`text-sm font-bold transition-colors ${pathname === '/katalog' ? 'text-blue-600 dark:text-blue-400' : 'text-foreground/70 hover:text-foreground'}`}>Katalog</Link>
            <Link href="#" className="text-sm font-bold text-foreground/70 hover:text-foreground transition-colors">Tentang Kami</Link>
          </div>

          {/* BAGIAN KANAN: Ikon Aksi */}
          <div className="flex items-center gap-2 sm:gap-4 z-50">
            
            {/* Tombol Search */}
            <button onClick={() => setIsSearchOpen(true)} className="p-2 text-foreground/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <Search className="w-5 h-5" />
            </button>

            {/* Tombol Profil / Login */}
            {isInitialized && (
              user ? (
                // Jika login sebagai admin arahkan ke dashboard admin, jika user biasa arahkan ke profil
                <Link href={user.role === 'admin' ? '/admin' : '/profile'} className="p-2 text-foreground/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 hidden sm:block">
                  <User className="w-5 h-5" />
                </Link>
              ) : (
                // Jika belum login, tampilkan Universal Login Button "Masuk"
                <Link href="/auth/login" className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-foreground px-4 py-2 rounded-full hover:bg-blue-600 hover:text-white transition-all hidden sm:block">
                  Masuk
                </Link>
              )
            )}

            {/* Tombol Keranjang */}
            <Link href="/cart" className="relative p-2 text-foreground/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <ShoppingBag className="w-5 h-5" />
              {items.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                  {items.length}
                </span>
              )}
            </Link>

            {/* Tombol Hamburger Mobile */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-foreground/70 hover:text-foreground md:hidden rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* =========================================
          LIVE SEARCH OVERLAY MODAL
      ========================================= */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-100 flex flex-col bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-200">
          
          {/* Header Search Bar */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <Search className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
              <input 
                autoFocus
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari T-Shirt, Pants, Hoodie..." 
                className="flex-1 bg-transparent text-xl md:text-3xl font-black text-foreground outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 w-full"
              />
              <button onClick={() => setIsSearchOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 text-foreground/60 hover:text-foreground rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Area Hasil Pencarian */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
              
              {searchQuery.trim() === '' ? (
                <div className="text-center pt-20 text-slate-400 dark:text-slate-500">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">Ketik sesuatu untuk mulai mencari produk.</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center pt-20 text-slate-400 dark:text-slate-500">
                  <p className="font-bold text-lg text-foreground mb-1">Yah, produk tidak ditemukan 😔</p>
                  {/* PERBAIKAN LINTER: Menggunakan &quot; untuk tanda kutip ganda */}
                  <p>Coba gunakan kata kunci lain seperti &quot;Oversized&quot; atau &quot;Hoodie&quot;.</p>
                </div>
              ) : (
                <div className="space-y-2 pb-20">
                  <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-4">Menampilkan {searchResults.length} Hasil</p>
                  
                  {searchResults.map((product) => (
                    <Link 
                      key={product.id} 
                      href={`/product/${product.id}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group shadow-sm hover:shadow-md"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md uppercase tracking-widest mb-1 inline-block">{product.category}</span>
                        <h4 className="font-bold text-foreground text-sm sm:text-base truncate group-hover:text-blue-600 transition-colors">{product.name}</h4>
                        <p className="font-black text-foreground mt-1">{formatRupiah(product.price)}</p>
                      </div>
                      <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MOBILE MENU (HAMBURGER)
      ========================================= */}
      <div className={`md:hidden fixed inset-0 z-40 bg-white dark:bg-slate-900 transition-transform duration-300 flex flex-col pt-24 px-6 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col gap-6 text-xl font-bold text-foreground">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>Beranda</Link>
          <Link href="/#katalog" onClick={() => setIsMobileMenuOpen(false)}>Katalog Produk</Link>
          <Link href="#" onClick={() => setIsMobileMenuOpen(false)}>Tentang Kami</Link>
          <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between">
            Keranjang Belanja
            {items.length > 0 && <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">{items.length} Barang</span>}
          </Link>
        </div>
        <div className="mt-auto pb-8 pt-8 border-t border-slate-100 dark:border-slate-800">
          {isInitialized && user ? (
            <Link href={user.role === 'admin' ? '/admin' : '/profile'} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-foreground py-4 rounded-2xl font-bold w-full">
              <User className="w-5 h-5" /> {user.role === 'admin' ? 'Panel Admin' : 'Akun Saya'}
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