"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Truck, ShoppingBag, ShieldCheck, RefreshCcw, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../../store/cartStore';

export default function CheckoutPage() {
  const { items, getTotalPrice, removeItem, addItem } = useCartStore();
  
  // State untuk form pengiriman (nantinya dikirim ke Doku/Database)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });

  const subtotal = getTotalPrice();
  // Contoh perhitungan pajak 10%
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayment = (e) => {
    e.preventDefault();
    // Di sini nanti logika integrasi Doku dipanggil
    alert("Proses ke Doku Payment Gateway...");
  };

  // Jika keranjang kosong, arahkan kembali ke toko
  if (items.length === 0) {
    return (
      <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen flex flex-col items-center justify-center text-center">
        <ShoppingBag className="w-20 h-20 text-slate-200 mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Keranjang kosong</h2>
        <p className="text-slate-500 mb-8">Anda harus memilih produk sebelum melakukan checkout.</p>
        <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
          Kembali Berbelanja
        </Link>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      {/* Checkout Flow Header */}
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">Selesaikan Pesanan</h1>
        <div className="flex justify-center items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</span>
            <span className="text-sm font-semibold text-slate-900">Keranjang</span>
          </div>
          <div className="h-px w-8 bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-bold">2</span>
            <span className="text-sm font-semibold text-slate-900">Pengiriman</span>
          </div>
          <div className="h-px w-8 bg-slate-200"></div>
          <div className="flex items-center gap-2 opacity-40">
            <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold">3</span>
            <span className="text-sm font-semibold text-slate-500">Pembayaran</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area (Kiri) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Shipping Section */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <Truck className="text-blue-600 w-6 h-6" />
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Informasi Pengiriman</h2>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">Nama Depan</label>
                <input required name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm" placeholder="Contoh: Budi" type="text" />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">Nama Belakang</label>
                <input required name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm" placeholder="Contoh: Santoso" type="text" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">Alamat Lengkap</label>
                <input required name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm" placeholder="Nama jalan, gedung, no rumah" type="text" />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">Kota/Kabupaten</label>
                <input required name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm" placeholder="Jakarta Selatan" type="text" />
              </div>
              <div className="col-span-1 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">Provinsi</label>
                  <input required name="state" value={formData.state} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm" placeholder="DKI Jakarta" type="text" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">Kode Pos</label>
                  <input required name="zip" value={formData.zip} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm" placeholder="12345" type="text" />
                </div>
              </div>
            </form>
          </section>

          {/* Cart Items Section */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-blue-600 w-6 h-6" />
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Pesanan Anda ({items.length})</h2>
              </div>
              <Link href="/cart" className="text-blue-600 text-sm font-semibold hover:underline underline-offset-4">Edit Pesanan</Link>
            </div>
            
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-6 group">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="w-full h-full object-cover" alt={item.name} src={item.image} />
                  </div>
                  <div className="grow">
                    <div className="flex justify-between mb-1">
                      <h3 className="font-bold text-slate-900">{item.name}</h3>
                      <span className="font-bold text-slate-900">{formatRupiah(item.price)}</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">{item.category}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                        <button onClick={() => removeItem(item.id)} className="p-1 text-slate-500 hover:text-red-500 transition-colors font-bold text-lg">-</button>
                        <span className="px-4 text-sm font-bold text-slate-900">{item.quantity}</span>
                        <button onClick={() => addItem(item)} className="p-1 text-slate-500 hover:text-blue-600 transition-colors font-bold text-lg">+</button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline">Hapus</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Summary (Kanan) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Order Summary Card */}
          <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl sticky top-28">
            <h2 className="text-xl font-bold tracking-tight mb-8">Ringkasan Pembayaran</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="font-medium text-white">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Pengiriman</span>
                <span className="font-medium text-green-400">Gratis</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Pajak (10%)</span>
                <span className="font-medium text-white">{formatRupiah(tax)}</span>
              </div>
              <div className="pt-4 border-t border-slate-700 flex justify-between items-end">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-black tracking-tighter text-blue-400">{formatRupiah(total)}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <button onClick={handlePayment} className="w-full py-4 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                Lanjut ke Pembayaran <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[9px] text-center text-slate-500 uppercase tracking-widest font-bold">
                Transaksi Aman Terenkripsi SSL 256-bit
              </p>
            </div>

            {/* Promo Code */}
            <div className="mt-8 pt-8 border-t border-slate-700">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Kode Promo</label>
              <div className="flex gap-2">
                <input className="grow bg-slate-800 border-none rounded-full px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ketik kode promo..." type="text" />
                <button className="bg-white text-slate-900 text-xs font-bold px-6 rounded-full hover:bg-slate-200 transition-colors">Pakai</button>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-100 p-6 rounded-xl text-center shadow-sm">
              <ShieldCheck className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-900 leading-tight uppercase tracking-wider">Dijamin Asli</p>
            </div>
            <div className="bg-white border border-slate-100 p-6 rounded-xl text-center shadow-sm">
              <RefreshCcw className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-900 leading-tight uppercase tracking-wider">Garansi Retur 7 Hari</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}