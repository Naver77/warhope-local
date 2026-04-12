"use client";

import React, { useState } from 'react';
import Link from 'next/link';
// Anda mungkin perlu menyesuaikan cara mengambil ID jika menggunakan Next.js versi 15+ (menggunakan React.use())
// Untuk versi di bawah itu, useParams() biasanya digunakan.
import { useParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Heart, ShieldCheck, Truck, RefreshCcw, Star } from 'lucide-react';
import { useCartStore } from '../../../../store/cartStore';
import { products } from '../../../../lib/data';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id;
  
  const { addItem } = useCartStore();
  
  // State untuk varian produk
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Hitam');
  const [quantity, setQuantity] = useState(1);

  // Cari produk berdasarkan ID dari URL
  const product = products.find(p => p.id === productId);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const handleAddToCart = () => {
    if (product) {
      // Kita tambahkan informasi varian ke item sebelum dimasukkan ke keranjang
      // Catatan: Di implementasi nyata, Anda mungkin ingin membuat ID keranjang unik
      // berdasarkan kombinasi produk_id + ukuran + warna.
      addItem({
        ...product,
        quantity: quantity,
        selectedSize,
        selectedColor
      });
      alert('Produk berhasil ditambahkan ke keranjang!');
    }
  };

  // Jika produk tidak ditemukan (ID salah)
  if (!product) {
    return (
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Produk Tidak Ditemukan</h1>
        <p className="text-slate-500 mb-8">Maaf, kami tidak dapat menemukan produk yang Anda cari.</p>
        <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
          Kembali ke Beranda
        </Link>
      </main>
    );
  }

  return (
    <main className="pt-28 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-8">
        <Link href="/" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
        <span>/</span>
        <Link href="/" className="hover:text-blue-600 transition-colors">Toko</Link>
        <span>/</span>
        <span className="text-slate-900">{product.category}</span>
        <span>/</span>
        <span className="text-slate-400 truncate w-32 md:w-auto">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        
        {/* Gambar Produk (Kiri) */}
        <div className="space-y-4">
          <div className="aspect-4/5 w-full rounded-3xl overflow-hidden bg-slate-100 relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            {/* Label Edisi Terbatas (Opsional, bisa dinamis) */}
            <div className="absolute top-6 left-6">
              <span className="bg-white/90 backdrop-blur-sm text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
                New Arrival
              </span>
            </div>
          </div>
          
          {/* Thumbnail Gallery (Dummy) */}
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className={`aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer border-2 transition-all ${idx === 1 ? 'border-blue-600' : 'border-transparent hover:border-slate-300'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>

        {/* Informasi Produk (Kanan) */}
        <div className="flex flex-col">
          {/* Header & Harga */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">{product.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-2xl font-black text-blue-600">{formatRupiah(product.price)}</span>
              <div className="flex items-center gap-1 text-yellow-400 bg-yellow-50 px-2.5 py-1 rounded-full border border-yellow-100">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-bold text-yellow-700 mt-0.5">4.9 (128 Ulasan)</span>
              </div>
            </div>
            <p className="text-slate-600 leading-relaxed text-base">
              {product.description} Ini adalah tambahan deskripsi detail produk. Material berkualitas tinggi dengan jahitan presisi untuk memastikan kenyamanan dan daya tahan maksimal saat digunakan beraktivitas sehari-hari.
            </p>
          </div>

          <div className="h-px w-full bg-slate-100 mb-8"></div>

          {/* Varian Warna */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Warna</h3>
              <span className="text-sm font-medium text-slate-500">{selectedColor}</span>
            </div>
            <div className="flex gap-3">
              {['Hitam', 'Putih', 'Navy', 'Abu-abu'].map((color) => {
                // Konversi nama warna ke kode warna hex untuk tampilan UI
                const colorHex = color === 'Hitam' ? '#0f172a' : color === 'Putih' ? '#ffffff' : color === 'Navy' ? '#1e3a8a' : '#94a3b8';
                return (
                  <button 
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${selectedColor === color ? 'border-blue-600 ring-2 ring-blue-100 ring-offset-2' : 'border-slate-200 hover:border-slate-300'}`}
                    title={color}
                  >
                    <span className="w-10 h-10 rounded-full border border-black/5" style={{ backgroundColor: colorHex }}></span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Varian Ukuran */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Ukuran</h3>
              <button className="text-xs font-bold text-blue-600 hover:underline underline-offset-4">Panduan Ukuran</button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
              {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                <button 
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3.5 rounded-xl text-sm font-bold transition-all border ${
                    selectedSize === size 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-600 hover:text-blue-600'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Pengaturan Jumlah & Tombol Keranjang */}
          <div className="flex gap-4 mb-8">
            {/* Input Jumlah */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 h-14 w-32 shrink-0">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 font-bold text-xl transition-colors"
              >
                -
              </button>
              <span className="flex-1 text-center font-bold text-slate-900">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 font-bold text-xl transition-colors"
              >
                +
              </button>
            </div>

            {/* Tombol Utama */}
            <button 
              onClick={handleAddToCart}
              className="flex-1 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              Masukkan Keranjang
            </button>
            
            {/* Tombol Wishlist */}
            <button className="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shrink-0">
              <Heart className="w-5 h-5" />
            </button>
          </div>

          {/* Fitur / Benefit Icons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto pt-8 border-t border-slate-100">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <Truck className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">Gratis Ongkir</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Untuk pembelian di atas Rp 500rb</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <RefreshCcw className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">Garansi Tukar Ukuran</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Maksimal 3 hari setelah diterima</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">100% Produk Original</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Jaminan uang kembali jika terbukti palsu</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}