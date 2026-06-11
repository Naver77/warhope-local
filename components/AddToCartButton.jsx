"use client";

import React, { useMemo } from 'react';
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
  const { user, isInitialized } = useAuthStore();

  // ✅ DETEKSI ROLE ADMIN
  const userRole = user?.role?.toLowerCase();
  const isManagement = userRole === 'superadmin' || userRole === 'admin_staff' || userRole === 'admin';

  // AMBIL STATUS SEBELUM DI-KLIK
  const isWished = isInWishlist(product.id);

  // Logika Cerdas: Cek Ketersediaan Stok dari kolom 'stock'
  const { availableSize, hasStock } = useMemo(() => {
    let sizeName = "All Size";
    
    // Cek apakah stok di tabel products lebih dari 0
    const isAvailable = product.stock > 0; 

    // Mencari varian ukuran pertama untuk dimasukkan otomatis ke keranjang
    if (product.sizes) {
      if (Array.isArray(product.sizes)) {
        sizeName = product.sizes[0] || "All Size";
      } else {
        const parsedSizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
        const activeSizes = Object.entries(parsedSizes).filter(([, data]) => data.active);
          
        if (activeSizes.length > 0) {
          sizeName = activeSizes[0][0]; 
        }
      }
    }
    return { availableSize: sizeName, hasStock: isAvailable };
  }, [product.sizes, product.stock]); 

  const handleAdd = (e) => {
    e.preventDefault(); 
    
    if (isInitialized && !user) {
      addToast('Silakan masuk (login) terlebih dahulu.', 'error');
      router.push('/auth/login');
      return;
    }

    // ✅ BLOKIR JIKA USER ADALAH ADMIN
    if (isManagement) {
      addToast('Anda tidak memiliki akses ini (Akun Manajemen).', 'error');
      return;
    }

    if (!hasStock) {
      addToast('Maaf, stok produk ini sedang kosong.', 'error');
      return;
    }

    addItem({
      ...product,
      selectedColor: "Default", 
      selectedSize: availableSize,
      quantity: 1
    });
    
    addToast(`${product.name} dimasukkan ke keranjang.`, 'success');
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    
    if (isInitialized && !user) {
      addToast('Silakan masuk (login) untuk menggunakan Wishlist.', 'error');
      router.push('/auth/login');
      return;
    }

    // ✅ BLOKIR JIKA USER ADALAH ADMIN
    if (isManagement) {
      addToast('Anda tidak memiliki akses ini (Akun Manajemen).', 'error');
      return;
    }

    // Eksekusi Toggle ke State (DITAMBAHKAN: parameter user.email untuk sinkronisasi Database)
    toggleWishlist(product, user.email);
    
    // LOGIKA NOTIFIKASI YANG BENAR:
    // Jika sebelumnya belum ada (!isWished), berarti sekarang DITAMBAHKAN.
    if (!isWished) {
      addToast('Ditambahkan ke Wishlist!', 'success');
    } else {
      addToast('Dihapus dari Wishlist.', 'info');
    }
  };

  return (
    <div className="flex items-center gap-2 z-10">
      <button 
        onClick={handleWishlist}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all shadow-sm active:scale-95 ${isWished ? 'bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700'}`}
        title="Wishlist"
      >
        <Heart className={`w-4 h-4 ${isWished ? 'fill-current' : ''}`} />
      </button>

      <button 
        onClick={handleAdd}
        // Atribut 'disabled' dihapus secara sengaja agar event onClick selalu terpancing dan memunculkan toast penolakan.
        // Visual 'disabled' tetap dipertahankan menggunakan styling class di bawah ini jika stok habis.
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all shadow-sm active:scale-95 
          ${hasStock ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white hover:scale-105' 
          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
        title={hasStock ? "Tambah ke Keranjang" : "Stok Habis"}
      >
        <ShoppingCart className="w-4 h-4" />
      </button>
    </div>
  );
}