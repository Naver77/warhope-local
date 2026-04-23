"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../../store/cartStore';
import { useAuthStore } from '../../../store/authStore';
import { useOrderStore } from '../../../store/orderStore'; 

const PROVINCES = [
  { name: 'Pilih Provinsi...', cost: 0 },
  { name: 'DKI Jakarta', cost: 10000 },
  { name: 'Jawa Barat', cost: 15000 },
  { name: 'Jawa Tengah', cost: 20000 },
  { name: 'Jawa Timur', cost: 25000 },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user, isInitialized, checkAuth } = useAuthStore();
  const addOrder = useOrderStore((state) => state.addOrder);
  
  const [isClient, setIsClient] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', zip: ''
  });

  const [baseShipping, setBaseShipping] = useState(0);

  // Perbaikan 1: Gunakan setTimeout agar setState tidak sinkron dan menghindari cascading render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true);
      checkAuth();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkAuth]);

  // Perbaikan 2: Sama halnya di sini, gunakan setTimeout dan cegah update jika email sudah terisi
  useEffect(() => {
    if (isClient && isInitialized) {
      if (!user) {
        alert('Anda harus masuk (login) untuk melanjutkan pembayaran.');
        router.push('/auth/login');
      } else if (!formData.email) {
        const timer = setTimeout(() => {
          const nameParts = user.name ? user.name.split(' ') : [];
          setFormData(prev => ({
            ...prev,
            email: user.email || '',
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || ''
          }));
        }, 0);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, isInitialized, user, router]);

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.1;
  const shippingCost = baseShipping; // Menggunakan baseShipping langsung
  const adminFee = 1500; 
  const grandTotal = subtotal + tax + shippingCost + adminFee;

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProvinceChange = (e) => {
    const provName = e.target.value;
    const selectedProv = PROVINCES.find(p => p.name === provName);
    setFormData(prev => ({ ...prev, state: provName }));
    setBaseShipping(selectedProv ? selectedProv.cost : 0);
  };

  const handlePayment = (e) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.email || !formData.address || !formData.phone) {
      alert('Mohon lengkapi semua data pengiriman dengan benar.');
      return;
    }

    if (baseShipping === 0) {
      alert('Mohon pilih Provinsi pengiriman terlebih dahulu.');
      return;
    }

    setIsProcessing(true);

    // SIMULASI PROSES PEMBAYARAN & SIMPAN KE LOCALSTORAGE (SYARAT UTS)
    setTimeout(() => {
      // 1. Generate ID Transaksi
      const transactionId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 2. Buat objek order
      const newOrder = {
        id: transactionId,
        date: new Date().toISOString(),
        customer: formData,
        items: items,
        shippingCost,
        tax,
        totalAmount: grandTotal,
        status: 'LUNAS (Simulasi)'
      };

      // 3. Simpan ke LocalStorage
      addOrder(newOrder);

      // 4. Kosongkan keranjang
      clearCart();

      alert(`Pembayaran Berhasil!\nID Transaksi Anda: ${transactionId}`);
      setIsProcessing(false);
      
      // Redirect ke halaman awal
      router.push('/'); 
    }, 1500);
  };

  if (!isClient || !isInitialized || !user) return <div className="min-h-screen pt-32 bg-background"></div>;

  if (items.length === 0) {
    return (
      <main className="pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center">
        <ShoppingBag className="w-20 h-20 text-slate-200 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Keranjang Anda kosong</h2>
        <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-xl mt-4 inline-block font-bold">Kembali Berbelanja</Link>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Selesaikan Pesanan</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-8 space-y-8">
          
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <Truck className="text-blue-600 w-6 h-6" />
              <h2 className="text-xl font-bold">Informasi Pengiriman</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-2">Nama Depan *</label>
                <input name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-2">Nama Belakang</label>
                <input name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-2">Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm" readOnly />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-2">No HP *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-bold uppercase mb-2">Alamat Lengkap *</label>
                <input name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-2">Kota/Kabupaten *</label>
                <input name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-2">Provinsi *</label>
                  <select name="state" value={formData.state} onChange={handleProvinceChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">
                    {PROVINCES.map((prov) => (
                      <option key={prov.name} value={prov.name}>{prov.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-2">Kode Pos</label>
                  <input name="zip" value={formData.zip} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl sticky top-28">
            <h2 className="text-xl font-bold tracking-tight mb-8">Total Pembayaran</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal Produk</span>
                <span className="font-medium text-white">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Pengiriman</span>
                <span className="font-medium text-white">{formatRupiah(shippingCost)}</span>
              </div>
              <div className="pt-4 border-t border-slate-700 flex justify-between items-end">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-black text-blue-400">{formatRupiah(grandTotal)}</span>
              </div>
            </div>
            
            <button 
              onClick={handlePayment} 
              disabled={isProcessing || baseShipping === 0}
              className="w-full py-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-500 transition-all flex justify-center disabled:opacity-50"
            >
              {isProcessing ? 'Memproses...' : 'Selesaikan Pembayaran'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}