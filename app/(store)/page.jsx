"use client";

import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, CheckCircle2,} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  // MENGAMBIL DATA DARI FILE JSON (SYARAT UTS)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/products.json');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Gagal mengambil data produk:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = [
    { name: 'Semua', count: products.length },
    { name: 'T-Shirts', count: products.filter(p => p.category === 'T-Shirts').length },
    { name: 'Hoodies', count: products.filter(p => p.category === 'Hoodies').length },
    { name: 'Pants', count: products.filter(p => p.category === 'Pants').length },
    { name: 'Knitwear', count: products.filter(p => p.category === 'Knitwear').length },
  ];

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const filteredProducts = activeCategory === 'Semua' 
    ? products 
    : products.filter(product => product.category === activeCategory);

  return (
    <main className="pt-32 pb-16 max-w-7xl mx-auto px-6 min-h-screen">
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
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col">
                  <div className="h-64 bg-slate-100 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={product.name} src={product.image} />
                    <button className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:bg-white hover:text-red-500 transition-colors text-slate-400">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">{product.category}</p>
                    <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{product.name}</h3>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{product.description}</p>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="font-black text-slate-900">{formatRupiah(product.price)}</span>
                      <button 
                        onClick={() => addItem({...product, quantity: 1, selectedSize: 'M', selectedColor: 'Default'})}
                        className="p-2 bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        title="Tambah ke Keranjang"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}