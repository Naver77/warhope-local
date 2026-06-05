"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Loader2, PackageX } from 'lucide-react';
import ProductCard from '../../../components/ProductCard'; 
import { useProductStore } from '../../../store/productStore';

export default function KatalogPage() {
  // 1. Ambil data dan status loading langsung dari Global Cache (Zustand)
  const { products, isLoading, fetchProducts } = useProductStore();
  
  // 2. State lokal hanya untuk inputan user (UI)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // 3. Tarik data (Akan instan 0 detik jika data sudah ada di cache)
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 4. SOLUSI ESLINT: Gunakan useMemo untuk derivasi data (Tanpa useEffect & useState ganda)
  const categories = useMemo(() => {
    if (!products) return ['Semua'];
    return ['Semua', ...new Set(products.map(p => p.category).filter(Boolean))].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products;

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

    return result;
  }, [products, searchQuery, selectedCategory]);

  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
      
      {/* Header Katalog */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-3">
            Katalog Koleksi
          </h1>
          <p className="text-foreground/60 text-lg max-w-2xl">
            Eksplorasi gaya urban sejati. Temukan produk streetwear premium dengan kualitas material terbaik untuk keseharianmu.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari T-Shirt, Hoodie..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none transition-shadow shadow-sm"
          />
        </div>
      </div>

      {/* Filter Kategori */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-4 mb-8">
        <div className="flex items-center gap-2 mr-2 text-slate-400">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Filter:</span>
        </div>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              selectedCategory === cat 
                ? 'bg-blue-600 text-white shadow-md border border-blue-600' 
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-foreground/70 hover:border-slate-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid Produk */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-foreground/60 font-medium">Memuat koleksi terbaru...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 animate-in fade-in duration-700">
          {filteredProducts.map((product) => (
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
            onClick={() => { setSearchQuery(''); setSelectedCategory('Semua'); }}
            className="mt-6 text-blue-600 font-bold hover:underline"
          >
            Reset Pencarian
          </button>
        </div>
      )}

    </main>
  );
}