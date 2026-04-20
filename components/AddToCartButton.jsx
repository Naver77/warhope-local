"use client";

import React from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';

export default function AddToCartButton({ product }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useToastStore((state) => state.addToast);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  
  // Ambil data user dari authStore untuk mengecek apakah sudah login
  const { user, isInitialized } = useAuthStore();

  const handleAdd = (e) => {
    e.preventDefault(); // Mencegah link terpicu jika tombol ada di dalam komponen Link
    
    // PROTEKSI: Cek apakah user sudah login
    if (isInitialized && !user) {
      addToast('Silakan masuk (login) terlebih dahulu untuk menambahkan ke keranjang.', 'error');
      router.push('/auth/login');
      return;
    }

    const defaultColor = Array.isArray(product.colors) ? product.colors[0] : "Default";
    const defaultSize = Array.isArray(product.sizes) ? product.sizes[0] : "All Size";

    addItem({
      ...product,
      selectedColor: defaultColor,
      selectedSize: defaultSize,
      quantity: 1
    });
    
    addToast(`${product.name} dimasukkan ke keranjang.`, 'success');
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    
    // PROTEKSI: Cek apakah user sudah login
    if (isInitialized && !user) {
      addToast('Silakan masuk (login) untuk menggunakan fitur Wishlist.', 'error');
      router.push('/auth/login');
      return;
    }

    toggleWishlist(product);
    const isAdded = !isInWishlist(product.id);
    addToast(isAdded ? 'Ditambahkan ke Wishlist!' : 'Dihapus dari Wishlist.', 'info');
  };

  const isWished = isInWishlist(product.id);

  return (
    <div className="flex items-center gap-2 z-10">
      {/* Tombol Wishlist */}
      <button 
        onClick={handleWishlist}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all shadow-md active:scale-95 ${isWished ? 'bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500'}`}
        title="Wishlist"
      >
        <Heart className={`w-4 h-4 ${isWished ? 'fill-current' : ''}`} />
      </button>

      {/* Tombol Keranjang */}
      <button 
        onClick={handleAdd}
        className="w-10 h-10 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white hover:scale-105 transition-all shadow-md active:scale-95"
        title="Tambah ke Keranjang"
      >
        <ShoppingCart className="w-4 h-4" />
      </button>
    </div>
  );
}