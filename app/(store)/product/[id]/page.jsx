"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Minus, Plus, ShoppingBag, ShieldCheck, Star, MessageSquare } from 'lucide-react';

import { useCartStore } from '../../../../store/cartStore';
import { useAuthStore } from '../../../../store/authStore';

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  // Di app router Next.js, jika file .jsx, pastikan handle unwrap param dengan aman
  const id = params?.id ? parseInt(params.id, 10) : null;

  const [product, setProduct] = useState(null);
  const selectedColor = 'Default'; // Menggunakan default karena opsi warna dummy dihapus
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('deskripsi');
  
  // STATE ULASAN DUMMY
  const [reviews, setReviews] = useState([
    { id: 1, user_name: "Ahmad", rating: 5, comment: "Kualitas bahannya sangat bagus dan nyaman dipakai seharian.", created_at: new Date().toISOString() },
    { id: 2, user_name: "Budi", rating: 4, comment: "Ukurannya pas, tapi pengiriman agak lama.", created_at: new Date().toISOString() }
  ]);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);

  const { user } = useAuthStore();
  const addItem = useCartStore((state) => state.addItem);

  // EFEK MENCARI PRODUK DARI JSON LOKAL
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await fetch('/products.json');
        const productsData = await response.json();
        
        // Cari produk berdasarkan ID (harus di-parse ke number)
        const foundProduct = productsData.find(p => p.id === id);
        
        if (foundProduct) {
          setProduct(foundProduct);
          // Set default size (kalau ada logic array, kalau tidak pakai "M")
          setSelectedSize(Array.isArray(foundProduct.sizes) ? foundProduct.sizes[0] : 'M');
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, router]);

  if (isLoading || !product) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleAddToCart = () => {
    addItem({
      ...product,
      selectedColor,
      selectedSize,
      quantity
    });
    alert(`${quantity}x ${product.name} berhasil ditambahkan ke keranjang!`);
  };

  // SIMULASI SUBMIT ULASAN
  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!user) {
      alert('Silakan masuk (login) terlebih dahulu untuk memberikan ulasan.');
      return;
    }
    if (newReview.trim() === '') {
      alert('Ulasan tidak boleh kosong.');
      return;
    }

    const newReviewData = {
      id: Date.now(),
      user_name: user.name || 'Pengguna',
      rating: newRating,
      comment: newReview,
      created_at: new Date().toISOString()
    };

    // Tambah ke state lokal
    setReviews([newReviewData, ...reviews]);
    setNewReview('');
    setNewRating(5);
    alert('Terima kasih! Ulasan Anda telah diterbitkan.');
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";

  return (
    <main className="min-h-screen bg-background pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Tombol Kembali */}
        <Link href="/" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors font-medium mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Katalog
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* KOLOM KIRI: Gambar Produk & Tabs */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="relative aspect-4/5 md:aspect-square bg-slate-100 rounded-4xl overflow-hidden p-4 group">
              <div className="w-full h-full rounded-3xl overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <span className="absolute top-8 left-8 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-foreground shadow-sm">
                {product.category}
              </span>
            </div>

            {/* Area Tabs */}
            <div className="bg-white border border-slate-200 rounded-4xl p-6 md:p-8 shadow-sm">
              <div className="flex overflow-x-auto hide-scrollbar gap-6 border-b border-slate-200 mb-6 pb-2">
                <button onClick={() => setActiveTab('deskripsi')} className={`pb-2 whitespace-nowrap text-sm font-bold relative ${activeTab === 'deskripsi' ? 'text-blue-600' : 'text-foreground/50'}`}>
                  Deskripsi
                  {activeTab === 'deskripsi' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full -mb-2.5"></span>}
                </button>
                <button onClick={() => setActiveTab('ulasan')} className={`pb-2 whitespace-nowrap text-sm font-bold relative flex items-center gap-2 ${activeTab === 'ulasan' ? 'text-blue-600' : 'text-foreground/50'}`}>
                  Ulasan <span className="bg-slate-100 text-[10px] px-2 py-0.5 rounded-full">{reviews.length}</span>
                  {activeTab === 'ulasan' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full -mb-2.5"></span>}
                </button>
              </div>

              <div className="text-foreground/70 text-sm leading-relaxed">
                {activeTab === 'deskripsi' && (
                  <div className="animate-in fade-in duration-500">
                    <p>{product.description}</p>
                  </div>
                )}
                {activeTab === 'ulasan' && (
                  <div className="animate-in fade-in duration-500">
                    {/* Form Ulasan Sederhana */}
                    <form onSubmit={handleSubmitReview} className="mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <h4 className="font-bold text-foreground mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Berikan Ulasan Anda</h4>
                      <div className="flex items-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => setNewRating(star)}>
                            <Star className={`w-6 h-6 ${star <= newRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>
                      <textarea 
                        value={newReview} onChange={(e) => setNewReview(e.target.value)} 
                        placeholder="Ceritakan pengalaman Anda..." 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none resize-none mb-2"
                        rows={2}
                      ></textarea>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Kirim Ulasan</button>
                    </form>

                    {/* List Ulasan */}
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b border-slate-100 pb-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs uppercase">{review.user_name.charAt(0)}</div>
                              <div>
                                <p className="font-bold text-sm leading-none">{review.user_name}</p>
                                <p className="text-[10px] text-foreground/50 mt-1">{formatDate(review.created_at)}</p>
                              </div>
                            </div>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (<Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />))}
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

          {/* KOLOM KANAN: Informasi Pembelian */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            <div className="sticky top-28 bg-white p-6 md:p-8 rounded-4xl border border-slate-100 shadow-sm">
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-3 leading-tight">{product.name}</h1>
                <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => setActiveTab('ulasan')}>
                  <div className="flex text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <span className="font-bold text-foreground text-sm">{averageRating}</span>
                  <span className="text-sm font-medium text-blue-600 hover:underline">({reviews.length} Ulasan)</span>
                </div>
                <p className="text-2xl font-black text-foreground">{formatRupiah(product.price)}</p>
              </div>

              <hr className="border-slate-200 mb-8" />

              {/* Ukuran Dummy */}
              <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-3">Ukuran</h3>
                <div className="grid grid-cols-4 gap-2">
                  {['S', 'M', 'L', 'XL'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all border ${selectedSize === size ? 'border-blue-600 bg-blue-600 text-white shadow-md' : 'border-slate-200 bg-white text-foreground hover:border-slate-400'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kuantitas & Tombol Tambah */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-2 py-2 w-full sm:w-32 border border-slate-200">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl hover:bg-white transition-colors"><Minus className="w-4 h-4 mx-auto" /></button>
                  <span className="font-bold w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-xl hover:bg-white transition-colors"><Plus className="w-4 h-4 mx-auto" /></button>
                </div>
                <button onClick={handleAddToCart} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                  <ShoppingBag className="w-5 h-5" /> Masukkan Keranjang
                </button>
              </div>

              {/* Info */}
              <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3 border border-green-100">
                <ShieldCheck className="w-6 h-6 text-green-600 shrink-0" />
                <p className="text-xs text-green-800 font-medium leading-relaxed">Pengiriman dijamin aman. Simulasi UTS Database Lokal.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}