"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';

import { useWishlistStore } from '../../../store/wishlistStore';
import { useCartStore } from '../../../store/cartStore';
import { useAuthStore } from '../../../store/authStore';
import { useToastStore } from '../../../store/toastStore';

export default function WishlistPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  const { wishlist, toggleWishlist, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { user, isInitialized, checkAuth } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  // Mencegah Hydration Mismatch & Cek Autentikasi
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true);
      checkAuth();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkAuth]);

  // PROTEKSI HALAMAN: Hanya untuk pengguna yang sudah Login
  useEffect(() => {
    if (isClient && isInitialized && !user) {
      addToast('Anda harus masuk (login) untuk melihat Wishlist.', 'error');
      router.push('/auth/login');
    }
  }, [isClient, isInitialized, user, router, addToast]);

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  const handleMoveToCart = (product) => {
    const defaultColor = Array.isArray(product.colors) && product.colors.length > 0 ? product.colors[0] : "Default";
    
    // Logika Cerdas: Parsing ukuran dari Supabase JSONB
    let defaultSize = "All Size";
    if (product.sizes) {
      if (Array.isArray(product.sizes)) {
        defaultSize = product.sizes[0] || "All Size";
      } else {
        const parsedSizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
        const activeSizes = Object.entries(parsedSizes).filter(([, data]) => data.active);
        if (activeSizes.length > 0) defaultSize = activeSizes[0][0];
      }
    }

    addItem({
      ...product,
      selectedColor: defaultColor,
      selectedSize: defaultSize,
      quantity: 1
    });

    toggleWishlist(product);
    addToast(`${product.name} dipindahkan ke Keranjang!`, 'success');
  };

  const handleRemove = (product) => {
    toggleWishlist(product);
    addToast(`${product.name} dihapus dari Wishlist.`, 'info');
  };

  // Jangan render konten jika belum diinisialisasi atau user tidak ada
  if (!isClient || !isInitialized || !user) {
    return <div className="min-h-screen bg-background pt-32 pb-24"></div>;
  }

  return (
    <main className="min-h-screen bg-background pt-8 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
      
      {/* Tombol Kembali */}
      <Link href="/#katalog" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors font-medium mb-8 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali Belanja
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Wishlist Saya <Heart className="w-8 h-8 text-red-500 fill-red-500" />
          </h1>
          <p className="text-foreground/60 mt-2">Daftar produk yang Anda impikan. Wujudkan sekarang!</p>
        </div>
        
        {wishlist.length > 0 && (
          <button 
            onClick={() => {
              if (window.confirm('Yakin ingin mengosongkan semua wishlist?')) {
                clearWishlist();
                addToast('Wishlist berhasil dikosongkan.', 'info');
              }
            }}
            className="text-sm font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-4 py-2 rounded-full transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Kosongkan Semua
          </button>
        )}
      </div>

      {wishlist.length === 0 ? (
        /* KONDISI KOSONG */
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-4xl p-12 text-center flex flex-col items-center justify-center min-h-[50vh] shadow-sm animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Heart className="w-10 h-10 text-red-300 dark:text-red-800" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Wishlist Anda Kosong</h2>
          <p className="text-foreground/60 mb-8 max-w-md">
            Anda belum menyimpan produk apa pun. Temukan gaya favorit Anda dan simpan di sini untuk dibeli nanti!
          </p>
          <Link 
            href="/#katalog"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-blue-600/30 active:scale-95 flex items-center gap-2"
          >
            Eksplorasi Katalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* DAFTAR WISHLIST */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {wishlist.map((product) => (
            <div key={product.id} className="bg-white dark:bg-slate-800/50 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 overflow-hidden group flex flex-col">
              
              <div className="block aspect-4/5 bg-slate-100 dark:bg-slate-900 relative overflow-hidden p-2">
                <div className="w-full h-full rounded-2xl overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    alt={product.name} 
                    src={product.image} 
                  />
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors"></div>
                </div>
                
                {/* Tombol Hapus Cepat (Absolute) */}
                <button 
                  onClick={() => handleRemove(product)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                  title="Hapus dari Wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2">{product.category}</p>
                <Link href={`/product/${product.id}`}>
                  <h3 className="text-lg font-bold text-foreground mb-1 leading-tight hover:text-blue-600 transition-colors line-clamp-1">{product.name}</h3>
                </Link>
                
                <p className="font-black text-blue-600 dark:text-blue-400 text-lg mb-6">{formatRupiah(product.price)}</p>
                
                <div className="mt-auto flex justify-between items-center gap-3">
                  <button 
                    onClick={() => handleMoveToCart(product)}
                    className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold text-sm hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" /> Beli Sekarang
                  </button>
                </div>
              </div>
              
            </div>
          ))}
        </div>
      )}
    </main>
  );
}