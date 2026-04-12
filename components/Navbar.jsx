"use client";

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export default function Navbar() {
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const cartCount = getTotalItems();

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <Link href="/" className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
          Warhope
        </Link>
        <div className="hidden md:flex items-center space-x-8">
          <Link className="text-blue-600 border-b-2 border-blue-600 pb-1 font-semibold" href="/">Terbaru</Link>
          <a className="text-slate-500 hover:text-slate-900 transition-colors font-medium" href="#">Pakaian</a>
          <a className="text-slate-500 hover:text-slate-900 transition-colors font-medium" href="#">Aksesoris</a>
          <a className="text-slate-500 hover:text-slate-900 transition-colors font-medium" href="#">Koleksi</a>
        </div>
        <div className="flex items-center gap-4">
          {/* Tombol Keranjang dibungkus Link menuju /cart */}
          <Link href="/cart" className="relative p-2 hover:bg-slate-100 rounded-full transition-all active:scale-95 block">
            <ShoppingCart className="w-5 h-5 text-slate-700" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-all active:scale-95">
            <User className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>
    </nav>
  );
}