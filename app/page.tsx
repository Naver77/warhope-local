import React from 'react';
import Link from 'next/link';
import { Heart, CheckCircle2, Mail, ArrowRight, Sparkles, ShieldCheck, Truck } from 'lucide-react';
import { getAllProducts } from '../lib/api'; // IMPORT API SUPABASE
import AddToCartButton from '../components/AddToCartButton'; // Komponen Client terpisah

// Interface TypeScript
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
}

// Server Component (Tidak pakai "use client")
export default async function Home() {
  
  // Mengambil data LANGSUNG dari Supabase
  const products = await getAllProducts();

  // Karena ini Server Component, kita tidak bisa pakai useState untuk filter.
  // Untuk kesederhanaan awal, kita tampilkan semua produk dulu.
  // (Filter dinamis akan membutuhkan URL Params nantinya).
  
  const categories = [
    { name: 'Semua', count: products.length },
    { name: 'T-Shirts', count: products.filter(p => p.category === 'T-Shirts').length },
    { name: 'Hoodies', count: products.filter(p => p.category === 'Hoodies').length },
    { name: 'Pants', count: products.filter(p => p.category === 'Pants').length },
    { name: 'Accessories', count: products.filter(p => p.category === 'Accessories').length },
  ];

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <main className="pt-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 min-h-screen">
      
      {/* HERO SECTION TETAP SAMA */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-16">
        <div className="md:col-span-2 relative bg-slate-200 dark:bg-slate-800 rounded-4xl overflow-hidden min-h-100 md:min-h-125 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="https://plus.unsplash.com/premium_photo-1687294575653-288f6105c4a2?q=80&w=1200&auto=format&fit=crop" 
            alt="Fashion Lifestyle" 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white">
            <span className="inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-white/20">
              Koleksi Musim Panas
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
              Esensi Kasual <br />Untuk Modernitas.
            </h1>
            <Link href="#katalog" className="bg-white text-slate-900 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-slate-100 transition-all shadow-lg inline-flex items-center gap-2 group/btn">
              Eksplorasi Koleksi
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:gap-6">
          <div className="bg-slate-900 rounded-4xl p-8 flex-1 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
            <Sparkles className="w-8 h-8 text-blue-400 mb-4" />
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">Diskon 20%</h2>
            <p className="text-slate-400 text-sm font-medium mb-6">Untuk pembelian pertama apparel berbahan linen premium.</p>
            <Link href="#katalog" className="text-white font-bold text-sm flex items-center gap-1 hover:text-blue-400 transition-colors">
              Belanja Sekarang <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-slate-100 dark:bg-slate-800 rounded-4xl relative overflow-hidden flex-1 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600&auto=format&fit=crop" 
              alt="Knitwear" 
              className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-all duration-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <h3 className="text-2xl font-black text-white tracking-widest uppercase shadow-sm">Knitwear</h3>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BADGES TETAP SAMA */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-20">
        <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-4 shadow-sm transition-colors">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm">Gratis Pengiriman</h4>
            <p className="text-xs text-foreground/60 mt-1">Ke seluruh Indonesia</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-4 shadow-sm transition-colors">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm">Kualitas Terjamin</h4>
            <p className="text-xs text-foreground/60 mt-1">100% material organik</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-4 shadow-sm transition-colors">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm">Desain Eksklusif</h4>
            <p className="text-xs text-foreground/60 mt-1">Gaya kasual modern</p>
          </div>
        </div>
      </section>

      {/* CATALOG SECTION DENGAN DATA SUPABASE */}
      <section id="katalog" className="scroll-mt-32">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-blue-600 font-bold text-xs tracking-widest uppercase mb-2 block">Katalog Utama</span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Kurasi Pilihan</h2>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl sticky top-28 shadow-sm transition-colors">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-6">Filter Kategori</h3>
              <div className="space-y-4">
                {categories.map((cat, index) => (
                  <label key={cat.name} className="flex items-center justify-between group cursor-pointer">
                    <span className={`text-sm font-medium transition-colors ${index === 0 ? 'text-foreground font-bold' : 'text-foreground/60 group-hover:text-foreground'}`}>
                      {cat.name}
                    </span>
                    {index === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-foreground" />
                    ) : (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-foreground/50 font-bold">{cat.count}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* JIKA DATA KOSONG */}
            {products.length === 0 && (
              <div className="col-span-full py-12 text-center text-foreground/60 bg-white/50 dark:bg-slate-800/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <p>Belum ada produk di database Supabase.</p>
              </div>
            )}

            {/* LOOPING DATA SUPABASE */}
            {products.map((product: Product) => (
              <div key={product.id} className="bg-white dark:bg-slate-800/50 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 overflow-hidden group flex flex-col">
                <Link href={`/product/${product.id}`} className="block aspect-4/5 bg-slate-100 dark:bg-slate-900 relative overflow-hidden p-2">
                  <div className="w-full h-full rounded-2xl overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={product.name} src={product.image} />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors"></div>
                  </div>
                </Link>

                <div className="p-6 flex flex-col flex-1">
                  <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2">{product.category}</p>
                  <Link href={`/product/${product.id}`}>
                    <h3 className="text-lg font-bold text-foreground mb-1 leading-tight hover:text-blue-600 transition-colors">{product.name}</h3>
                  </Link>
                  <p className="text-sm text-foreground/60 mb-6 line-clamp-2">{product.description}</p>
                  
                  <div className="mt-auto pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="font-black text-foreground text-lg">{formatRupiah(product.price)}</span>
                    
                    {/* TOMBOL ADD TO CART DIPISAH KE KOMPONEN CLIENT */}
                    <AddToCartButton product={product} />

                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER TETAP SAMA */}
      <section className="mt-24">
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-4xl p-8 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center gap-12 border border-transparent dark:border-slate-800">
          <div className="absolute top-0 right-0 w-1/2 h-full hidden md:block opacity-5 dark:opacity-10">
            <Mail className="w-full h-full -translate-y-20 translate-x-20 text-slate-900 dark:text-white" />
          </div>
          
          <div className="relative z-10 flex-1 space-y-6">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
              Bergabunglah <br/>Bersama Kami.
            </h2>
            <p className="text-foreground/70 font-medium text-lg max-w-md">
              Dapatkan akses awal untuk rilisan terbatas, pembaruan misi organik kami, dan diskon 10% untuk pesanan pertama Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <input 
                type="email" 
                placeholder="Masukkan alamat email..." 
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all text-foreground"
              />
              <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white hover:shadow-lg transition-all active:scale-95 whitespace-nowrap">
                Berlangganan
              </button>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}