"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, CheckCircle2, Mail } from 'lucide-react';

// Pastikan path ini benar sesuai dengan struktur folder Anda
import { useCartStore } from '../store/cartStore'; 
import { products } from '../lib/data';

// Mendefinisikan tipe data untuk Produk
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
}

// PERBAIKAN: Mendefinisikan tipe data untuk State Zustand
// Idealnya interface ini juga di-export dari file cartStore Anda
interface CartState {
  addItem: (product: Product) => void;
  // Tambahkan state lain di sini jika ada (misal: items: Product[], removeItem: dll)
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  // State untuk menggantikan fungsi alert() bawaan browser
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // PERBAIKAN: Mengganti 'any' dengan 'CartState'
  const addItem = useCartStore((state: CartState) => state.addItem);

  const categories = [
    { name: 'Semua', count: 4 },
    { name: 'T-Shirts', count: 1 },
    { name: 'Hoodies', count: 1 },
    { name: 'Pants', count: 1 },
    { name: 'Knitwear', count: 1 },
  ];

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(number);
  };

  const filteredProducts = activeCategory === 'Semua' 
    ? products 
    : products.filter((product: Product) => product.category === activeCategory);

  // Fungsi untuk menangani penambahan ke keranjang dan menampilkan notifikasi
  const handleAddToCart = (product: Product) => {
    addItem(product);
    setToastMessage(`${product.name} berhasil ditambahkan!`);
    
    // Menghilangkan notifikasi setelah 3 detik
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <main className="pt-32 pb-16 max-w-7xl mx-auto px-6 min-h-screen relative">
      
      {/* Toast Notification Custom (Pengganti Alert) */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-300 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">Pakaian Kasual Terbaru</h1>
        <p className="text-slate-500 text-lg max-w-2xl leading-relaxed font-medium">
          Koleksi esensial musim ini dirancang khusus untuk Anda yang menyukai gaya minimalis modern. Dirancang dengan presisi untuk kenyamanan harian.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 space-y-10 shrink-0">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Kategori Produk</h3>
            <div className="space-y-3">
              {categories.map((cat) => (
                <label key={cat.name} className="flex items-center justify-between group cursor-pointer" onClick={() => setActiveCategory(cat.name)}>
                  <span className={`text-sm font-medium transition-colors ${activeCategory === cat.name ? 'text-blue-600 font-bold' : 'text-slate-700 group-hover:text-blue-600'}`}>
                    {cat.name}
                  </span>
                  {activeCategory === cat.name ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  ) : (
                    <span className="text-xs bg-slate-200/70 px-2 py-0.5 rounded-full text-slate-500 font-medium">{cat.count}</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {filteredProducts.map((product: Product) => (
              <div key={product.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col">
                
                <Link href={`/product/${product.id}`} className="block h-64 bg-slate-100 relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={product.name} src={product.image} />
                  <button 
                    onClick={(e) => {
                      e.preventDefault(); 
                    }} 
                    className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:bg-white hover:text-red-500 transition-colors text-slate-400"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </Link>

                <div className="p-6 flex flex-col flex-1">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">{product.category}</p>
                  <Link href={`/product/${product.id}`}>
                    <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight hover:text-blue-600 transition-colors">{product.name}</h3>
                  </Link>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{product.description}</p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-black text-slate-900">{formatRupiah(product.price)}</span>
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="p-2 bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      title="Tambah ke Keranjang"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* CTA Bento Card */}
            <div className="bg-blue-600 rounded-3xl p-8 flex flex-col justify-center items-center text-center space-y-5 shadow-lg shadow-blue-600/20">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm border border-white/30">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-white mb-2">Dapatkan Akses Awal</h3>
                <p className="text-sm text-blue-100 font-medium leading-relaxed">Bergabunglah untuk mendapatkan info diskon terbaru.</p>
              </div>
              <button className="w-full py-3.5 bg-white text-blue-900 rounded-xl font-bold shadow-md hover:bg-slate-50 active:scale-95 transition-all">
                Daftar Sekarang
              </button>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}