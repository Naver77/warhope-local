"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Minus, Plus, ShoppingBag, ShieldCheck, Star, MessageSquare, Send } from 'lucide-react';

// Import state management & API
import { useCartStore } from '../../../../store/cartStore';
import { useAuthStore } from '../../../../store/authStore';
import { useToastStore } from '../../../../store/toastStore';
import { getProductById } from '../../../../lib/api'; // Menggunakan API Supabase asli

// Data Ulasan Dummy
const initialReviews = [
  { id: 1, name: 'Budi Santoso', rating: 5, date: '12 Apr 2026', comment: 'Kualitas bahannya sangat bagus, tebal tapi tidak bikin gerah. Potongan oversized-nya juga pas banget di badan saya.' },
  { id: 2, name: 'Arief R.', rating: 4, date: '08 Apr 2026', comment: 'Warna aslinya sedikit lebih gelap dari foto, tapi secara keseluruhan sangat puas dengan cuttingannya.' },
  { id: 3, name: 'Diana P.', rating: 5, date: '02 Apr 2026', comment: 'Pengiriman super cepat! Packingnya juga sangat eksklusif dan aman. Bakal langganan terus nih.' },
];

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  // --- STATE ---
  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  // State untuk Tabs dan Ulasan
  const [activeTab, setActiveTab] = useState('deskripsi');
  const [reviews, setReviews] = useState(initialReviews);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);

  const { user } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const addItem = useCartStore((state) => state.addItem);

  // --- EFEK MENCARI PRODUK ---
  // PERBAIKAN LINTER: Menggunakan Async Function agar pembaruan state tidak memblokir render
  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;

      try {
        const foundProduct = await getProductById(id);
        if (foundProduct) {
          setProduct(foundProduct);
          setSelectedColor(foundProduct.colors?.[0] || 'Default');
          setSelectedSize(foundProduct.sizes?.[0] || 'All Size');
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error("Gagal mengambil data produk:", error);
        router.push('/');
      }
    };

    fetchProductData();
  }, [id, router]);

  if (!product) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const handleAddToCart = () => {
    addItem({
      ...product,
      selectedColor,
      selectedSize,
      quantity
    });
    addToast(`${quantity}x ${product.name} berhasil ditambahkan ke keranjang!`, 'success');
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!user) {
      addToast('Silakan masuk (login) terlebih dahulu untuk memberikan ulasan.', 'error');
      return;
    }
    if (newReview.trim() === '') {
      addToast('Ulasan tidak boleh kosong.', 'error');
      return;
    }

    const reviewObj = {
      id: Date.now(),
      name: user.name || 'Pengguna Warhope',
      rating: newRating,
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      comment: newReview
    };

    setReviews([reviewObj, ...reviews]);
    setNewReview('');
    setNewRating(5);
    addToast('Terima kasih! Ulasan Anda telah diterbitkan.', 'success');
  };

  // Kalkulasi rata-rata rating
  const averageRating = (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1);

  return (
    <main className="min-h-screen bg-background pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Tombol Kembali */}
        <Link href="/#katalog" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors font-medium mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Katalog
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* KOLOM KIRI: Gambar Produk & Tabs */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            {/* Foto Produk */}
            <div className="relative aspect-4/5 md:aspect-square bg-slate-100 dark:bg-slate-800 rounded-4xl overflow-hidden p-4 group">
              <div className="w-full h-full rounded-3xl overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors duration-500"></div>
              </div>
              <span className="absolute top-8 left-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-foreground shadow-sm">
                {product.category}
              </span>
            </div>

            {/* Area Tabs (Deskripsi, Spesifikasi, Ulasan) */}
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-4xl p-6 md:p-8 shadow-sm">
              <div className="flex overflow-x-auto hide-scrollbar gap-6 border-b border-slate-200 dark:border-slate-700 mb-6 pb-2">
                <button onClick={() => setActiveTab('deskripsi')} className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors relative ${activeTab === 'deskripsi' ? 'text-blue-600 dark:text-blue-400' : 'text-foreground/50 hover:text-foreground'}`}>
                  Deskripsi
                  {activeTab === 'deskripsi' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full -mb-2.5"></span>}
                </button>
                <button onClick={() => setActiveTab('spesifikasi')} className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors relative ${activeTab === 'spesifikasi' ? 'text-blue-600 dark:text-blue-400' : 'text-foreground/50 hover:text-foreground'}`}>
                  Spesifikasi
                  {activeTab === 'spesifikasi' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full -mb-2.5"></span>}
                </button>
                <button onClick={() => setActiveTab('ulasan')} className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors relative flex items-center gap-2 ${activeTab === 'ulasan' ? 'text-blue-600 dark:text-blue-400' : 'text-foreground/50 hover:text-foreground'}`}>
                  Ulasan <span className="bg-slate-100 dark:bg-slate-700 text-[10px] px-2 py-0.5 rounded-full">{reviews.length}</span>
                  {activeTab === 'ulasan' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full -mb-2.5"></span>}
                </button>
              </div>

              <div className="text-foreground/70 text-sm leading-relaxed">
                {activeTab === 'deskripsi' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <p>{product.description}</p>
                    <p className="mt-4">Setiap produk Warhope dirancang dengan mengutamakan keseimbangan antara fungsionalitas dan estetika jalanan modern. Diproduksi dengan standar etis yang tinggi untuk menemani setiap langkah Anda.</p>
                  </div>
                )}
                {activeTab === 'spesifikasi' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-3">
                    <div className="flex border-b border-slate-100 dark:border-slate-800 pb-2"><span className="w-32 font-bold text-foreground">Material</span><span>100% Premium Cotton</span></div>
                    <div className="flex border-b border-slate-100 dark:border-slate-800 pb-2"><span className="w-32 font-bold text-foreground">Fitting</span><span>Oversized / Relaxed Fit</span></div>
                    <div className="flex border-b border-slate-100 dark:border-slate-800 pb-2"><span className="w-32 font-bold text-foreground">Perawatan</span><span>Cuci mesin dingin, jangan gunakan pemutih</span></div>
                  </div>
                )}
                {activeTab === 'ulasan' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* Form Tambah Ulasan */}
                    <form onSubmit={handleSubmitReview} className="mb-8 bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <h4 className="font-bold text-foreground mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Berikan Ulasan Anda</h4>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-bold text-foreground/60 uppercase tracking-widest mr-2">Rating:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => setNewRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                            <Star className={`w-6 h-6 ${star <= newRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} />
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <textarea 
                          value={newReview} onChange={(e) => setNewReview(e.target.value)} 
                          placeholder="Ceritakan pengalaman Anda dengan produk ini..." 
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-blue-600 outline-none resize-none text-foreground"
                          rows={3}
                        ></textarea>
                        <button type="submit" className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>

                    {/* Daftar Ulasan */}
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-foreground text-xs uppercase">
                                {review.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-foreground text-sm leading-none">{review.name}</p>
                                <p className="text-[10px] text-foreground/50 mt-1">{review.date}</p>
                              </div>
                            </div>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 dark:text-slate-700'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-foreground/70">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* KOLOM KANAN: Informasi Pembelian (Sticky) */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            <div className="sticky top-28 bg-white dark:bg-slate-800/30 p-6 md:p-8 rounded-4xl border border-transparent dark:border-slate-800">
              
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-3 leading-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => setActiveTab('ulasan')}>
                  <div className="flex text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <span className="font-bold text-foreground text-sm">{averageRating}</span>
                  <span className="text-sm font-medium text-blue-600 hover:underline">({reviews.length} Ulasan)</span>
                </div>
                <p className="text-2xl font-black text-foreground">
                  {formatRupiah(product.price)}
                </p>
              </div>

              <hr className="border-slate-200 dark:border-slate-800 mb-8" />

              {/* Pilihan Warna */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60">Warna</h3>
                  <span className="text-xs font-bold text-foreground">{selectedColor}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors?.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${selectedColor === color ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-foreground hover:border-blue-600/50'}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pilihan Ukuran */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60">Ukuran</h3>
                  <button className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:underline">Panduan Ukuran</button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {product.sizes?.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all border ${selectedSize === size ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-foreground hover:border-slate-400'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kuantitas & Tombol Tambah */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 rounded-2xl px-2 py-2 w-full sm:w-32 border border-slate-200 dark:border-slate-800">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-colors text-foreground"><Minus className="w-4 h-4" /></button>
                  <span className="font-bold text-foreground w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-colors text-foreground"><Plus className="w-4 h-4" /></button>
                </div>
                <button onClick={handleAddToCart} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-blue-600/30 active:scale-95 flex items-center justify-center gap-2">
                  <ShoppingBag className="w-5 h-5" /> Masukkan Keranjang
                </button>
              </div>

              {/* Info Garansi */}
              <div className="bg-green-50 dark:bg-green-900/10 rounded-2xl p-4 flex items-center gap-3 border border-green-100 dark:border-green-900/20">
                <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-500 shrink-0" />
                <p className="text-xs text-green-800 dark:text-green-400 font-medium leading-relaxed">
                  Garansi retur gratis dalam 7 hari. Pembayaran diamankan oleh sistem enkripsi terkini.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}