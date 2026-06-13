"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { Truck, ShoppingBag, ShieldCheck, ArrowRight, MapPin, ReceiptText, Tag } from 'lucide-react';
import { useCartStore } from '../../../store/cartStore';
import { useToastStore } from '../../../store/toastStore';
import { useAuthStore } from '../../../store/authStore';
import { createOrder, getProvinces } from '../../../lib/api'; 

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore(); 
  const addToast = useToastStore((state) => state.addToast);
  const { user, isInitialized, checkAuth } = useAuthStore();
  
  const [isClient, setIsClient] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State untuk menampung data provinsi dari database
  const [provinces, setProvinces] = useState([]);

  // 🔥 UPDATE: Menambah provinceId untuk select yang lebih aman
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', provinceId: '', zip: ''
  });

  const [baseShipping, setBaseShipping] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [shippingType, setShippingType] = useState('reguler'); 

  // Mengambil sesi otentikasi serta data provinsi saat halaman dimuat
  useEffect(() => {
    const initCheckout = async () => {
      setIsClient(true);
      await checkAuth();
      try {
        const data = await getProvinces();
        setProvinces(data || []);
      } catch (error) {
        console.error("Gagal mengambil data provinsi:", error);
      }
    };
    initCheckout();
  }, [checkAuth]);

  // AUTO-FILL DATA DARI PROFIL DAN VALIDASI KELENGKAPAN (Gerbang Keamanan)
  useEffect(() => {
    if (isClient && isInitialized) {
      if (!user) {
        addToast('Anda harus masuk (login) untuk melanjutkan pembayaran.', 'error');
        router.push('/auth/login');
        return; // Hentikan eksekusi
      } 

      // ✅ 1. VALIDASI KELENGKAPAN PROFIL TERLEBIH DAHULU
      const isProfileIncomplete = 
        !user.phone_number || 
        user.phone_number.trim() === "" || 
        !user.address || 
        user.address.trim() === "";

      if (isProfileIncomplete) {
        addToast("Lengkapi Nomor Telepon dan Alamat Anda sebelum melanjutkan pembayaran!", "error");
        router.replace("/profile"); // Gunakan replace agar tidak terjebak di tombol 'Back' browser
        return; // Hentikan eksekusi agar form tidak di-render setengah-setengah
      }

      // ✅ 2. JIKA LENGKAP, AUTO-FILL DATA KE FORM CHECKOUT
      const nameParts = user.name ? user.name.split(' ') : [];
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phone: user.phone_number || '', 
        address: user.address || ''     
      }));
      
    }
  }, [isClient, isInitialized, user, router, addToast]);

  // KALKULASI DISKON PRESISI
  const calculateTotals = () => {
    let originalTotal = 0;
    let finalTotal = 0;
    
    items.forEach(item => {
      const origPrice = Number(item.price) || 0;
      const finPrice = Number(item.finalPrice ?? item.final_price ?? origPrice);
      
      originalTotal += origPrice * item.quantity;
      finalTotal += finPrice * item.quantity;
    });

    return { 
      originalTotal, 
      finalTotal, 
      totalDiscount: originalTotal - finalTotal 
    };
  };

  const { originalTotal, finalTotal, totalDiscount } = calculateTotals();

  const subtotal = finalTotal;
  const shippingCost = baseShipping === 0 ? 0 : (shippingType === 'reguler' ? baseShipping : baseShipping + 20000);
  const grandTotal = subtotal + shippingCost;

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // 🔥 UPDATE: PENGAMBILAN ONGKIR MENGGUNAKAN ID PROVINSI
  const handleProvinceChange = (e) => {
    const provId = e.target.value;
    const selectedProv = provinces.find(p => String(p.id) === String(provId));
    
    if (selectedProv) {
      setFormData(prev => ({ 
        ...prev, 
        provinceId: provId,
        state: selectedProv.name // Tetap simpan nama untuk disimpan ke address string nanti
      }));
      setBaseShipping(Number(selectedProv.cost) || 0);
      setEstimatedTime(selectedProv.etd || '1-3 Hari');
    } else {
      setFormData(prev => ({ ...prev, provinceId: '', state: '' }));
      setBaseShipping(0);
      setEstimatedTime('');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.email || !formData.address || !formData.phone || !formData.city) {
      addToast('Mohon lengkapi semua data pengiriman dengan benar.', 'error');
      return;
    }

    if (baseShipping === 0) {
      addToast('Mohon pilih Provinsi pengiriman terlebih dahulu.', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/doku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          formData, 
          items, 
          shippingCost, 
          totalAmount: grandTotal 
        }), 
      });

      const data = await response.json();

      console.log("RESPONS DOKU:", data);

      if (response.ok && data.payment_url) {
        addToast(`Mencatat pesanan & memotong stok sementara...`, 'info');
        
        const fullAddress = `${formData.address}, ${formData.city}, Provinsi ${formData.state} ${formData.zip}`;
        
        // 🔥 UPDATE: Normalisasi key item untuk keseragaman database
        const itemsWithFinalPrice = items.map(item => ({
          ...item,
          price_at_purchase: item.finalPrice ?? item.final_price ?? item.price // Menggunakan nama key yg sama dengan tabel order_items
        }));

        const orderPayload = {
          invoice_number: data.order_id || `INVWH${Date.now()}`,
          customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
          customer_email: formData.email,
          customer_phone: formData.phone,
          shipping_address: fullAddress,
          items: itemsWithFinalPrice, 
          total_amount: grandTotal,
          status: 'pending', // Konsisten menggunakan huruf kecil untuk trigger Supabase
          user_id: user.id,
          // Menyisipkan preferensi tipe kurir (Reguler/Ekspres) agar admin tahu
          courier: shippingType === 'ekspres' ? 'Ekspres (Kilat)' : 'Reguler',
          payment_url: data.payment_url
        };

        await createOrder(orderPayload, itemsWithFinalPrice);
        clearCart(); 
        
        if (typeof window !== 'undefined' && window.loadJokulCheckout) {
          window.loadJokulCheckout(data.payment_url);
        } else {
          window.location.href = data.payment_url;
        }
      } else {
        throw new Error(data.error || "Gagal mendapatkan link pembayaran dari server.");
      }
    } catch (error) {
      console.error(error);
      addToast('Terjadi kesalahan saat memuat sistem pembayaran. Hubungi CS Warhope.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isClient || !isInitialized || !user) return <div className="min-h-screen pt-32 pb-20 bg-background"></div>;

  if (items.length === 0) {
    return (
      <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen flex flex-col items-center justify-center text-center">
        <ShoppingBag className="w-20 h-20 text-slate-200 dark:text-slate-800 mb-6" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Keranjang Anda kosong</h2>
        <p className="text-foreground/60 mb-8">Anda harus memilih produk sebelum melakukan checkout.</p>
        <Link href="/katalog" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
          Kembali Berbelanja
        </Link>
      </main>
    );
  }

  const isSandbox = process.env.NEXT_PUBLIC_DOKU_IS_PRODUCTION !== "true";
  const dokuScriptUrl = isSandbox 
    ? "https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js"
    : "https://jokul.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js";

  return (
    <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen bg-background">
      
      <Script src={dokuScriptUrl} strategy="lazyOnload" />

      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-4">Selesaikan Pesanan</h1>
        <div className="flex justify-center items-center gap-4">
          <Link href="/cart" className="flex items-center gap-2 group cursor-pointer">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-sm font-bold shadow-sm transition-colors group-hover:bg-blue-200">1</span>
            <span className="text-sm font-semibold text-foreground/70 group-hover:text-foreground">Keranjang</span>
          </Link>
          <div className="h-px w-8 bg-blue-600 dark:bg-blue-400"></div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">2</span>
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
                <input name="firstName" value={formData.firstName || ''} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all" placeholder="Budi" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2 px-1">Nama Belakang</label>
                <input name="lastName" value={formData.lastName || ''} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all" placeholder="Santoso" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2 px-1">Alamat Email *</label>
                <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground/50 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all cursor-not-allowed" placeholder="budi@email.com" readOnly />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2 px-1">Nomor HP / WhatsApp *</label>
                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all" placeholder="08123456789" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2 px-1">Alamat Lengkap *</label>
                <input name="address" value={formData.address || ''} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all" placeholder="Nama jalan, gedung, RT/RW, no rumah" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2 px-1">Kota/Kabupaten *</label>
                <input name="city" value={formData.city || ''} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all" placeholder="Misal: Jakarta Selatan, Kab. Bogor" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2 px-1">Provinsi *</label>
                  {/* 🔥 UPDATE: Select berdasarkan provinceId */}
                  <select 
                    name="provinceId" 
                    value={formData.provinceId || ''} 
                    onChange={handleProvinceChange} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Pilih Provinsi...</option>
                    {provinces.map((prov) => (
                      <option key={prov.id} value={prov.id}>{prov.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2 px-1">Kode Pos</label>
                  <input name="zip" value={formData.zip || ''} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all" placeholder="12345" />
                </div>
              </div>
            </div>
            
            <div className={`mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 transition-opacity duration-300 ${baseShipping === 0 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="text-blue-600 dark:text-blue-500 w-5 h-5" />
                <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">Metode Pengiriman dari Gudang Kami</h3>
              </div>
              
              {baseShipping === 0 && (
                <p className="text-xs text-amber-600 mb-4">Silakan pilih provinsi terlebih dahulu untuk melihat estimasi dan tarif pengiriman.</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`border rounded-xl p-4 cursor-pointer transition-all flex justify-between items-center ${shippingType === 'reguler' && baseShipping > 0 ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <div>
                    <p className="font-bold text-sm text-foreground">Reguler</p>
                    <p className="text-xs text-foreground/60 mt-1">Estimasi tiba dalam {estimatedTime || '-'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm">{baseShipping > 0 ? formatRupiah(baseShipping) : '-'}</span>
                    <input type="radio" name="shipping" value="reguler" checked={shippingType === 'reguler'} onChange={() => setShippingType('reguler')} disabled={baseShipping === 0} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  </div>
                </label>
                
                <label className={`border rounded-xl p-4 cursor-pointer transition-all flex justify-between items-center ${shippingType === 'ekspres' && baseShipping > 0 ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <div>
                    <p className="font-bold text-sm text-foreground">Ekspres (Kilat)</p>
                    <p className="text-xs text-foreground/60 mt-1">Dikirim dengan prioritas utama</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm">{baseShipping > 0 ? formatRupiah(baseShipping + 20000) : '-'}</span>
                    <input type="radio" name="shipping" value="ekspres" checked={shippingType === 'ekspres'} onChange={() => setShippingType('ekspres')} disabled={baseShipping === 0} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  </div>
                </label>
              </div>
            </div>

          </section>

          <section className="bg-white dark:bg-slate-800/50 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <ReceiptText className="text-blue-600 dark:text-blue-500 w-6 h-6" />
                <h2 className="text-xl font-bold tracking-tight text-foreground">Rincian Pesanan ({items.length})</h2>
              </div>
              <Link href="/cart" className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline">Edit Pesanan</Link>
            </div>
            
            <div className="space-y-6">
              {items.map((item) => {
                const uniqueKey = `${item.id}-${item.selectedColor}-${item.selectedSize}`;
                
                const origPrice = Number(item.price) || 0;
                const finPrice = Number(item.finalPrice ?? item.final_price ?? origPrice);
                const hasDiscount = finPrice < origPrice;

                return (
                  <div key={uniqueKey} className="flex items-center gap-6 group">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 shrink-0 border border-slate-100 dark:border-slate-700 relative">
                      {hasDiscount && (
                        <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg z-10">SALE</div>
                      )}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="w-full h-full object-cover" alt={item.name} src={item.image} />
                    </div>
                    <div className="grow">
                      <div className="flex justify-between mb-1 items-start gap-2">
                        <h3 className="font-bold text-foreground text-sm line-clamp-2 pr-4">{item.name}</h3>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-foreground text-sm block">
                            {formatRupiah(finPrice * item.quantity)}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] font-medium text-slate-400 line-through decoration-red-500/50 block">
                              {formatRupiah(origPrice * item.quantity)}
                            </span>
                          )}
                        </div>
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
            <h2 className="text-xl font-bold tracking-tight mb-8">Total Pembayaran</h2>
            <div className="space-y-4 mb-8">
              
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal Produk</span>
                <span className="font-medium text-white">{formatRupiah(originalTotal)}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-red-400 flex items-center gap-1.5">
                    <Tag className="w-3 h-3" /> Diskon Produk
                  </span>
                  <span className="font-bold text-red-400">-{formatRupiah(totalDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Pengiriman {baseShipping > 0 ? (shippingType === 'reguler' ? '(Reg.)' : '(Eks.)') : ''}</span>
                <span className="font-medium text-white">{formatRupiah(shippingCost)}</span>
              </div>
              
              <div className="pt-4 border-t border-slate-700 flex justify-between items-end">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-black tracking-tighter text-blue-400">{formatRupiah(grandTotal)}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={handlePayment} 
                disabled={isProcessing || baseShipping === 0}
                className="w-full py-4 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isProcessing ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Menghubungkan...</>
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