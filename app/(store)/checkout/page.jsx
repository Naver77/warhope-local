"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { Truck, ShoppingBag, ShieldCheck, ArrowRight, Package } from 'lucide-react';
import { useCartStore } from '../../../store/cartStore';
import { useToastStore } from '../../../store/toastStore';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const addToast = useToastStore((state) => state.addToast);
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', zip: ''
  });

  const [shippingCost, setShippingCost] = useState(15000); 

  const subtotal = getTotalPrice();
  const adminFee = 1000; 
  const total = subtotal + shippingCost + adminFee;

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleShippingChange = (e) => {
    setShippingCost(Number(e.target.value));
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.email || !formData.address) {
      addToast('Mohon lengkapi data diri dan alamat email Anda.', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/doku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, items, total, shippingCost, adminFee }), 
      });

      const data = await response.json();

      if (response.ok && data.payment_url) {
        addToast(`Memuat layar pembayaran aman...`, 'info');
        
        if (typeof window !== 'undefined' && window.loadJokulCheckout) {
          window.loadJokulCheckout(data.payment_url);
          clearCart(); 
        } else {
          window.location.href = data.payment_url;
        }

      } else {
        throw new Error(data.error || "Gagal mendapatkan link pembayaran dari server.");
      }
    } catch (error) {
      console.error(error);
      addToast('Terjadi kesalahan saat memuat sistem pembayaran. Cek log server.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen flex flex-col items-center justify-center text-center">
        <ShoppingBag className="w-20 h-20 text-slate-200 dark:text-slate-800 mb-6" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Keranjang kosong</h2>
        <p className="text-foreground/60 mb-8">Anda harus memilih produk sebelum melakukan checkout.</p>
        <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
          Kembali Berbelanja
        </Link>
      </main>
    );
  }

  // --- LOGIKA CERDAS: DETEKSI URL SCRIPT DOKU ---
  // Jika URL API di environment adalah sandbox, muat JS Sandbox. Jika tidak, muat JS Production.
  const isSandbox = process.env.NEXT_PUBLIC_DOKU_IS_PRODUCTION !== "true";
  const dokuScriptUrl = isSandbox 
    ? "https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js"
    : "https://jokul.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js";

  return (
    <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen bg-background">
      
      {/* SCRIPT DOKU CERDAS */}
      <Script 
        src={dokuScriptUrl} 
        strategy="lazyOnload" 
      />

      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-4">Selesaikan Pesanan</h1>
        <div className="flex justify-center items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">1</span>
            <span className="text-sm font-semibold text-foreground">Keranjang</span>
          </div>
          <div className="h-px w-8 bg-slate-200 dark:bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-sm font-bold shadow-sm">2</span>
            <span className="text-sm font-semibold text-foreground">Pengiriman & Bayar</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-8 space-y-8">
          
          <section className="bg-white dark:bg-slate-800/50 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-8">
              <Truck className="text-blue-600 dark:text-blue-500 w-6 h-6" />
              <h2 className="text-xl font-bold tracking-tight text-foreground">Informasi Pengiriman</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2 px-1">Nama Depan *</label>
                <input name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Budi" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2 px-1">Nama Belakang</label>
                <input name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Santoso" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2 px-1">Alamat Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="budi@email.com" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2 px-1">Nomor HP / WhatsApp</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="08123456789" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2 px-1">Alamat Lengkap *</label>
                <input name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Nama jalan, gedung, no rumah" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2 px-1">Kota/Kabupaten</label>
                <input name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Jakarta Selatan" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2 px-1">Provinsi</label>
                  <input name="state" value={formData.state} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="DKI Jakarta" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2 px-1">Kode Pos</label>
                  <input name="zip" value={formData.zip} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="12345" />
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <Package className="text-blue-600 dark:text-blue-500 w-5 h-5" />
                <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Metode Pengiriman</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`border rounded-xl p-4 cursor-pointer transition-all flex justify-between items-center ${shippingCost === 15000 ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <div>
                    <p className="font-bold text-sm text-foreground">Reguler</p>
                    <p className="text-xs text-foreground/60 mt-1">Estimasi 2-4 hari kerja</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm">{formatRupiah(15000)}</span>
                    <input type="radio" name="shipping" value={15000} checked={shippingCost === 15000} onChange={handleShippingChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  </div>
                </label>
                
                <label className={`border rounded-xl p-4 cursor-pointer transition-all flex justify-between items-center ${shippingCost === 25000 ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <div>
                    <p className="font-bold text-sm text-foreground">Ekspres (Cepat)</p>
                    <p className="text-xs text-foreground/60 mt-1">Estimasi 1-2 hari kerja</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm">{formatRupiah(25000)}</span>
                    <input type="radio" name="shipping" value={25000} checked={shippingCost === 25000} onChange={handleShippingChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  </div>
                </label>
              </div>
            </div>

          </section>

          <section className="bg-white dark:bg-slate-800/50 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-blue-600 dark:text-blue-500 w-6 h-6" />
                <h2 className="text-xl font-bold tracking-tight text-foreground">Pesanan Anda ({items.length})</h2>
              </div>
              <Link href="/cart" className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline">Edit Pesanan</Link>
            </div>
            
            <div className="space-y-6">
              {items.map((item) => {
                const uniqueKey = `${item.id}-${item.selectedSize}`;
                return (
                  <div key={uniqueKey} className="flex items-center gap-6 group">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 shrink-0 border border-slate-100 dark:border-slate-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="w-full h-full object-cover" alt={item.name} src={item.image} />
                    </div>
                    <div className="grow">
                      <div className="flex justify-between mb-1">
                        <h3 className="font-bold text-foreground text-sm">{item.name}</h3>
                        <span className="font-bold text-foreground text-sm">{formatRupiah(item.price)}</span>
                      </div>
                      <p className="text-xs text-foreground/60 mb-2">Size: {item.selectedSize}</p>
                      <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-foreground">Qty: {item.quantity}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 dark:bg-slate-800 border border-transparent dark:border-slate-700 text-white p-8 rounded-3xl shadow-xl sticky top-28">
            <h2 className="text-xl font-bold tracking-tight mb-8">Ringkasan Pembayaran</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal Produk</span>
                <span className="font-medium text-white">{formatRupiah(subtotal)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Pengiriman</span>
                <span className="font-medium text-white">{formatRupiah(shippingCost)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Biaya Admin Sistem</span>
                <span className="font-medium text-white">{formatRupiah(adminFee)}</span>
              </div>
              
              <div className="pt-4 border-t border-slate-700 flex justify-between items-end">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-black tracking-tighter text-blue-400">{formatRupiah(total)}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={handlePayment} 
                disabled={isProcessing}
                className="w-full py-4 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Menghubungi DOKU...
                  </>
                ) : (
                  <>Bayar dengan DOKU <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
              <p className="text-[9px] text-center text-slate-400 uppercase tracking-widest font-bold flex flex-col items-center gap-1 mt-2">
                <ShieldCheck className="w-3 h-3 text-blue-400" />
                Diperiksa & Diamankan oleh DOKU
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}