"use client";

import React from 'react';
import Link from 'next/link';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../../store/cartStore';

export default function CartPage() {
  const { items, removeItem, getTotalPrice } = useCartStore();

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <main className="pt-32 pb-16 max-w-7xl mx-auto px-6 min-h-screen">
      <header className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Keranjang Belanja</h1>
        <p className="text-slate-500 font-medium mt-2">Periksa kembali barang pesanan Anda sebelum melakukan pembayaran.</p>
      </header>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100 flex flex-col items-center">
          <ShoppingBag className="w-20 h-20 text-slate-200 mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Keranjang Anda masih kosong</h2>
          <p className="text-slate-500 mb-8">Temukan koleksi pakaian kasual terbaik kami dan mulai berbelanja.</p>
          <Link href="/" className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md">
            Mulai Belanja
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex gap-6 items-center">
                <div className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden shrink-0 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">{item.name}</h3>
                  <p className="text-slate-500 text-sm mt-1">Jumlah: {item.quantity}</p>
                  <p className="font-black text-blue-600 mt-2">{formatRupiah(item.price)}</p>
                </div>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                  title="Hapus barang"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <aside className="w-full lg:w-96 shrink-0">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 sticky top-32">
              <h3 className="text-xl font-black text-slate-900 mb-6">Ringkasan Pesanan</h3>
              
              <div className="space-y-4 mb-6 pb-6 border-b border-slate-100">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Total Harga</span>
                  <span className="text-slate-900 font-bold">{formatRupiah(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Pajak & Biaya Admin</span>
                  <span className="text-slate-900 font-bold">Dihitung saat checkout</span>
                </div>
              </div>

              <div className="flex justify-between text-lg mb-8">
                <span className="font-bold text-slate-900">Subtotal</span>
                <span className="font-black text-blue-600">{formatRupiah(getTotalPrice())}</span>
              </div>

              <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95">
                Lanjut ke Pembayaran <ArrowRight className="w-4 h-4" />
              </button>
              
              <p className="text-center text-[10px] text-slate-400 font-medium mt-4">
                Pembayaran aman didukung oleh Doku.
              </p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}