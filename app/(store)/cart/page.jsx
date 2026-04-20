"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { useCartStore } from '../../../store/cartStore';
import { useAuthStore } from '../../../store/authStore';
import { useToastStore } from '../../../store/toastStore';
import { useWishlistStore } from '../../../store/wishlistStore';

export default function CartPage() {
  const router = useRouter();
  const { user, isInitialized, checkAuth } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const { toggleWishlist } = useWishlistStore();
  
  const { items, removeItem, updateQuantity, updateVariant, getTotalPrice } = useCartStore();
  const [isClient, setIsClient] = useState(false);

  // Mencegah Hydration Mismatch dari Zustand LocalStorage
  useEffect(() => {
    // Menggunakan setTimeout untuk menjadikan state update asinkron 
    // dan menghindari peringatan linter "cascading renders"
    const timer = setTimeout(() => {
      setIsClient(true);
      checkAuth(); // Pastikan memeriksa sesi autentikasi saat komponen dimuat
    }, 0);

    return () => clearTimeout(timer);
  }, [checkAuth]);

  // PROTEKSI HALAMAN: Redirect ke Login jika tidak ada User
  useEffect(() => {
    if (isClient && isInitialized && !user) {
      addToast('Anda harus masuk (login) untuk melihat keranjang.', 'error');
      router.push('/auth/login');
    }
  }, [isClient, isInitialized, user, router, addToast]);

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  const handleMoveToWishlist = (item) => {
    toggleWishlist(item);
    removeItem(item.id, item.selectedColor, item.selectedSize);
    addToast(`${item.name} dipindahkan ke Wishlist`, 'info');
  };

  // Jangan render konten jika belum diinisialisasi atau user tidak ada (mencegah kedipan)
  if (!isClient || !isInitialized || !user) {
    return <div className="min-h-screen bg-background pt-32 pb-24"></div>;
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background pt-32 pb-24 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600" />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">Keranjang Kosong</h2>
        <p className="text-foreground/60 mb-8 max-w-sm">Sepertinya Anda belum memilih produk apa pun. Yuk, temukan koleksi terbaik kami!</p>
        <Link href="/#katalog" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2">
          Mulai Belanja <ArrowRight className="w-4 h-4" />
        </Link>
      </main>
    );
  }

  const totalPrice = getTotalPrice();
  const tax = totalPrice * 0.1; // Pajak PPN 10%
  const grandTotal = totalPrice + tax;

  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Keranjang Belanja</h1>
        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black text-sm px-3 py-1 rounded-full">
          {items.length} Barang
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* KOLOM KIRI: Daftar Barang */}
        <div className="lg:col-span-8 space-y-6">
          {items.map((item) => {
            const uniqueKey = `${item.id}-${item.selectedColor}-${item.selectedSize}`;
            
            return (
              <div key={uniqueKey} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Gambar Produk */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden shrink-0 relative group">
                  <Link href={`/product/${item.id}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </Link>
                </div>

                {/* Info Produk & Kontrol */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1">{item.category}</p>
                      <Link href={`/product/${item.id}`} className="font-bold text-lg md:text-xl text-foreground hover:text-blue-600 transition-colors line-clamp-1">
                        {item.name}
                      </Link>
                      <p className="font-black text-blue-600 dark:text-blue-400 mt-1">{formatRupiah(item.price)}</p>
                    </div>
                    
                    {/* Aksi Hapus & Pindah Wishlist */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <button 
                        onClick={() => removeItem(item.id, item.selectedColor, item.selectedSize)} 
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        title="Hapus barang"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleMoveToWishlist(item)} 
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                        title="Pindahkan ke Wishlist"
                      >
                        <Heart className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    
                    {/* DROPDOWN EDIT VARIAN (WARNA & UKURAN) */}
                    <div className="flex gap-2">
                      <select 
                        value={item.selectedColor}
                        onChange={(e) => updateVariant(item.id, item.selectedColor, item.selectedSize, e.target.value, item.selectedSize)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-foreground py-2 px-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer appearance-none"
                      >
                        {item.colors?.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      
                      <select 
                        value={item.selectedSize}
                        onChange={(e) => updateVariant(item.id, item.selectedColor, item.selectedSize, item.selectedColor, e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-foreground py-2 px-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer appearance-none"
                      >
                        {item.sizes?.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* KONTROL KUANTITAS (QTY) */}
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shrink-0">
                      <button 
                        onClick={() => updateQuantity(item.id, item.selectedColor, item.selectedSize, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.selectedColor, item.selectedSize, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-foreground transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* KOLOM KANAN: Ringkasan Total (Sticky) */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 dark:bg-slate-800 border border-transparent dark:border-slate-700 text-white p-6 md:p-8 rounded-3xl shadow-xl sticky top-28 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-xl font-bold tracking-tight mb-8">Ringkasan Belanja</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal Produk</span>
                <span className="font-medium text-white">{formatRupiah(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Estimasi Pajak (10%)</span>
                <span className="font-medium text-white">{formatRupiah(tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Biaya Pengiriman</span>
                <span className="font-medium text-amber-400">Dihitung di Checkout</span>
              </div>
              
              <div className="pt-4 border-t border-slate-700 flex justify-between items-end mt-6">
                <span className="text-base font-bold">Total Sementara</span>
                <span className="text-2xl font-black tracking-tighter text-blue-400">{formatRupiah(grandTotal)}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <Link href="/checkout" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                Lanjut ke Checkout <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="bg-white/5 rounded-xl p-4 flex items-start gap-3 mt-4">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-[10px] text-slate-300 leading-relaxed font-medium">Transaksi Anda aman. Pastikan detail produk yang dipilih sudah sesuai.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}