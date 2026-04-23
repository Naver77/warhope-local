"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, Package, Settings, LogOut, 
  CheckCircle, Truck, XCircle, 
  MapPin, Mail, Phone, ShoppingBag
} from 'lucide-react';

import { useAuthStore } from '../../../store/authStore';
import { useOrderStore } from '../../../store/orderStore'; // Menggunakan OrderStore kita
import { useCartStore } from '../../../store/cartStore';
import { useWishlistStore } from '../../../store/wishlistStore';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isInitialized, checkAuth, logout } = useAuthStore();
  const { orders, getOrdersByEmail } = useOrderStore(); // Ambil fungsi dari zustand order

  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [myOrders, setMyOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Mencegah Hydration Mismatch & Cek Auth
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true);
      checkAuth();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkAuth]);

  // PROTEKSI HALAMAN
  useEffect(() => {
    if (isClient && isInitialized && !user) {
      alert('Silakan masuk (login) untuk mengakses profil Anda.');
      router.push('/auth/login');
    }
  }, [isClient, isInitialized, user, router]);

  // MENGAMBIL DATA PESANAN DARI LOCAL STORAGE (SYARAT UTS)
  useEffect(() => {
    if (isClient && user) {
      // Bungkus dengan setTimeout untuk menghindari error "synchronous setState in effect" dari ESLint
      const loadingTimer = setTimeout(() => {
        setIsLoadingOrders(true);
      }, 0);

      const fetchTimer = setTimeout(() => {
        // Ambil data dari zustand store yang terkoneksi dengan localStorage
        const userOrders = getOrdersByEmail(user.email);
        setMyOrders(userOrders);
        setIsLoadingOrders(false);
      }, 500); // Simulasi loading tipis

      return () => {
        clearTimeout(loadingTimer);
        clearTimeout(fetchTimer);
      };
    }
  }, [isClient, user, getOrdersByEmail, orders]); // 'orders' dimasukkan agar re-render saat ada order baru

  const handleLogout = () => {
    const isConfirmed = window.confirm("Apakah Anda yakin ingin keluar?");
    if (isConfirmed) {
      logout();
      useCartStore.getState().clearCart();
      useWishlistStore.getState().clearWishlist();
      alert('Anda berhasil keluar.');
      router.push('/');
    }
  };

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'LUNAS (SIMULASI)': case 'PAID':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold w-fit"><CheckCircle className="w-3.5 h-3.5" /> {status}</span>;
      case 'DIKIRIM':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold w-fit"><Truck className="w-3.5 h-3.5" /> DIKIRIM</span>;
      case 'DIBATALKAN':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold w-fit"><XCircle className="w-3.5 h-3.5" /> DIBATALKAN</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold w-fit">{status}</span>;
    }
  };

  if (!isClient || !isInitialized || !user) return <div className="min-h-screen bg-background pt-32 pb-24"></div>;
  if (user.role === 'admin') { router.push('/admin'); return null; }

  return (
    <main className="min-h-screen bg-background pt-8 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Akun Saya</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* KOLOM KIRI: Navigasi Profil */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-2xl mb-4 uppercase tracking-widest">
              {user.name ? user.name.charAt(0) : 'W'}
            </div>
            <h2 className="font-bold text-foreground text-lg">{user.name || 'Pengguna Warhope'}</h2>
            <p className="text-sm text-foreground/60 mb-6">{user.email}</p>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Member</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col gap-2">
            <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all w-full text-left ${activeTab === 'orders' ? 'bg-blue-50 text-blue-600' : 'text-foreground/70 hover:bg-slate-50 hover:text-foreground'}`}>
              <Package className="w-5 h-5" /> Pesanan Saya
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all w-full text-left ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-foreground/70 hover:bg-slate-50 hover:text-foreground'}`}>
              <Settings className="w-5 h-5" /> Pengaturan
            </button>
            <div className="h-px bg-slate-100 my-2"></div>
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all w-full text-left">
              <LogOut className="w-5 h-5" /> Keluar
            </button>
          </div>
        </div>

        {/* KOLOM KANAN: Konten Tab */}
        <div className="lg:col-span-9">
          
          {/* TAB PESANAN SAYA */}
          {activeTab === 'orders' && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-xl font-bold tracking-tight text-foreground mb-6">Riwayat Pesanan</h2>
              
              {isLoadingOrders ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-foreground/60 text-sm">Memuat pesanan Anda...</p>
                </div>
              ) : myOrders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center shadow-sm">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Belum ada pesanan</h3>
                  <p className="text-foreground/60 mb-8 max-w-sm">Anda belum melakukan transaksi apa pun.</p>
                  <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all active:scale-95">Mulai Belanja</Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {myOrders.map((order) => (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm transition-all">
                      {/* Header Pesanan */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 mb-4 gap-4">
                        <div>
                          <p className="text-xs text-foreground/50 uppercase tracking-widest mb-1">
                            Tanggal Pesanan: <span className="font-bold text-foreground/80">{formatDate(order.date)}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-black text-foreground">{order.id}</h3>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-xs text-foreground/50 uppercase tracking-widest mb-1">Total Belanja</p>
                          <p className="font-black text-blue-600 text-lg">{formatRupiah(order.totalAmount)}</p>
                        </div>
                      </div>

                      {/* List Barang */}
                      <div className="space-y-4">
                        {order.items && order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl">
                            <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-foreground text-sm line-clamp-1">{item.name}</h4>
                              <p className="text-[11px] text-foreground/60 mt-1 uppercase tracking-widest font-bold">Size: {item.selectedSize}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-foreground">{item.quantity}x</p>
                              <p className="text-xs font-bold text-foreground/60 mt-1">{formatRupiah(item.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB PENGATURAN AKUN */}
          {activeTab === 'settings' && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-xl font-bold tracking-tight text-foreground mb-6">Pengaturan Akun</h2>
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Nama Lengkap</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <User className="w-5 h-5 text-slate-400 mr-3" />
                    <input type="text" defaultValue={user.name || ''} className="bg-transparent w-full outline-none text-foreground text-sm font-medium" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Alamat Email</label>
                  <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 opacity-70 cursor-not-allowed">
                    <Mail className="w-5 h-5 text-slate-400 mr-3" />
                    <input type="email" value={user.email || ''} readOnly className="bg-transparent w-full outline-none text-foreground text-sm font-medium cursor-not-allowed" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Nomor Telepon / WhatsApp</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <Phone className="w-5 h-5 text-slate-400 mr-3" />
                    <input type="tel" placeholder="081234567890" className="bg-transparent w-full outline-none text-foreground text-sm font-medium" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Alamat Pengiriman Utama</label>
                  <div className="flex items-start bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <MapPin className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                    <textarea rows={3} placeholder="Masukkan alamat lengkap Anda..." className="bg-transparent w-full outline-none text-foreground text-sm font-medium resize-none"></textarea>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-md active:scale-95">Simpan Perubahan</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}