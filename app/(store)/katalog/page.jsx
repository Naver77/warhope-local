"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, PackageX, ChevronDown, ArrowUpDown } from 'lucide-react';
import ProductCard from '../../../components/ProductCard'; 
import { useProductStore } from '../../../store/productStore';

export default function KatalogPage() {
  const { products, isLoading, fetchProducts } = useProductStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [sortBy, setSortBy] = useState('default');
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Pengecualian ESLint untuk trik Next.js Hydration
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    
    fetchProducts(); // Langsung fetch saat komponen di-mount
  }, [fetchProducts]);

  const categories = useMemo(() => {
    if (!products) return ['Semua'];
    return ['Semua', ...new Set(products.map(p => p.category).filter(Boolean))].sort();
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];
    let result = [...products];

    if (selectedCategory !== 'Semua') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      const priceA = a.final_price ?? a.price;
      const priceB = b.final_price ?? b.price;

      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      return 0; 
    });

    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  // HAPUS BARIS INI: if (!isMounted) return null;
  // Biarkan Next.js merender layout kasarnya dari Server!

  // Tentukan apakah kita harus menampilkan loading
  const showLoading = !isMounted || (isLoading && (!products || products.length === 0));

  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
      
      {/* Header Halaman (Akan langsung tampil secepat kilat) */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-3">
          Katalog Koleksi
        </h1>
        <p className="text-foreground/60 text-lg max-w-2xl">
          Eksplorasi gaya urban sejati. Temukan produk streetwear premium dengan kualitas material terbaik untuk keseharianmu.
        </p>
      </div>

      {/* Filter Bar (Akan langsung tampil) */}
      <div className="flex flex-col lg:flex-row gap-4 mb-12 bg-white dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari T-Shirt, Hoodie..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none transition-shadow"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group min-w-45">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 text-foreground text-sm font-bold appearance-none py-3.5 pl-11 pr-10 rounded-2xl cursor-pointer outline-none focus:ring-2 focus:ring-blue-600"
            >
              {/* Fallback option saat belum mounted */}
              {isMounted ? categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              )) : <option value="Semua">Semua</option>}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative group min-w-50">
            <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 text-foreground text-sm font-bold appearance-none py-3.5 pl-11 pr-10 rounded-2xl cursor-pointer outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="default">Urutkan Relevansi</option>
              <option value="price-asc">Harga: Terendah</option>
              <option value="price-desc">Harga: Tertinggi</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tampilan Area Produk */}
      {showLoading ? (
        // SKELETON LANGSUNG TAMPIL DARI SERVER
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3 animate-pulse">
              <div className="bg-slate-200 dark:bg-slate-800 aspect-square rounded-3xl w-full"></div>
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4 mt-2"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedProducts.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 animate-in fade-in duration-700">
          {filteredAndSortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-slate-50 dark:bg-slate-800/30 rounded-4xl border border-slate-100 dark:border-slate-800 border-dashed">
          <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <PackageX className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Produk Tidak Ditemukan</h3>
          <p className="text-foreground/60 max-w-md">
            Maaf, kami tidak dapat menemukan produk yang cocok dengan pencarian atau filter &quot;{searchQuery || selectedCategory}&quot;.
          </p>
          <button 
            onClick={() => { setSearchQuery(''); setSelectedCategory('Semua'); setSortBy('default'); }}
            className="mt-6 text-blue-600 font-bold hover:underline"
          >
            Reset Pencarian
          </button>
        </div>
      )}
    </main>
  );
}