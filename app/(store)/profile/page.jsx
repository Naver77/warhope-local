"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Package, Settings, LogOut, Clock, CheckCircle, Truck, XCircle,
  MapPin, Mail, Phone, ShoppingBag, AlertTriangle, CreditCard, ShieldCheck, 
  ArrowRight, AlertCircle, Save
} from "lucide-react";

import { useAuthStore } from "../../../store/authStore";
import { useToastStore } from "../../../store/toastStore";
import { useCartStore } from "../../../store/cartStore";
import { useWishlistStore } from "../../../store/wishlistStore";
import { supabase } from "../../../lib/supabase";
import { restoreOrderStock } from "../../../lib/api";

const PAYMENT_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export default function ProfilePage() {
  const router = useRouter();

  const { user, isInitialized, checkAuth, logout, updateUserProfile } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const clearCart = useCartStore((state) => state.clearCart);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  
  // STATE PESANAN
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // STATE FORM PROFIL
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone_number: "",
    address: ""
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // STATE CUSTOM MODAL
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    payload: null,
    title: "",
    message: "",
  });
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // 1. TRIGGER AWAL LOAD HALAMAN
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true);
      checkAuth();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkAuth]);

  // 2. GERBANG UTAMA (VALIDASI LOGIN & ROLE)
  useEffect(() => {
    if (isClient && isInitialized) {
      // A. Jika belum login, tendang ke halaman login
      if (!user) {
        addToast("Silakan masuk (login) untuk mengakses profil Anda.", "error");
        router.replace("/auth/login");
        return;
      }

      // B. Jika yang masuk ternyata Admin/Staff, tendang ke Dashboard Admin
      const userRole = user.role?.toLowerCase() || 'customer';
      const isAdminLevel = userRole === 'superadmin' || userRole === 'admin_staff' || userRole === 'admin';

      if (isAdminLevel) {
        router.replace("/admin");
        return;
      }

      // C. Jika Customer biasa (Valid), isi data form profilnya!
      setProfileForm({
        name: user.name || "",
        phone_number: user.phone_number || "",
        address: user.address || ""
      });

      // D. Cerdas: Jika nomor HP atau Alamat kosong, langsung arahkan ke tab Settings
      if (!user.phone_number || !user.address) {
        setActiveTab("settings");
      }
    }
  }, [isClient, isInitialized, user, router, addToast]);

  // 3. AMBIL DATA PESANAN DARI DATABASE
  useEffect(() => {
    const fetchMyOrders = async () => {
      if (!user?.id) return;
      setIsLoadingOrders(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id) 
          .order("created_at", { ascending: false });

        if (error) throw error;

        let fetchedOrders = data || [];
        let hasExpiredUpdates = false;
        const now = new Date().getTime();

        fetchedOrders = await Promise.all(
          fetchedOrders.map(async (order) => {
            if (order.status === "PENDING_PAYMENT" || order.status === "PENDING") {
              const orderTime = new Date(order.created_at).getTime();
              if (now - orderTime > PAYMENT_TIMEOUT_MS) {
                await supabase
                  .from("orders")
                  .update({ status: "EXPIRED" })
                  .eq("id", order.id);
                hasExpiredUpdates = true;
                return { ...order, status: "EXPIRED" };
              }
            }
            return order;
          })
        );

        if (hasExpiredUpdates) {
          addToast("Beberapa pesanan telah dibatalkan otomatis karena melewati batas waktu pembayaran.", "info");
        }

        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Gagal mengambil pesanan:", error);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    if (isClient && user) {
      fetchMyOrders();
    }
  }, [isClient, user, addToast]);

  // --- FUNGSI UPDATE PROFIL ---
  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSavingProfile(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: profileForm.name,
          phone_number: profileForm.phone_number,
          address: profileForm.address
        })
        .eq("id", user.id);

      if (error) throw error;

      updateUserProfile({
        name: profileForm.name,
        phone_number: profileForm.phone_number,
        address: profileForm.address
      });

      addToast("Profil berhasil diperbarui!", "success");
    } catch (error) {
      console.error("Error update profil:", error);
      addToast("Gagal memperbarui profil.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- FUNGSI MODAL ---
  const promptLogout = () => {
    setConfirmModal({
      isOpen: true,
      type: "logout",
      title: "Keluar Akun?",
      message: "Apakah Anda yakin ingin keluar dari akun Anda saat ini?",
    });
  };

  const promptCancelOrder = (orderId, invoiceNumber) => {
    setConfirmModal({
      isOpen: true,
      type: "cancel_order",
      payload: orderId,
      title: "Batalkan Pesanan?",
      message: `Anda yakin ingin membatalkan pesanan ${invoiceNumber}? Tindakan ini tidak dapat dikembalikan.`,
    });
  };

  const promptCompleteOrder = (orderId, invoiceNumber) => {
    setConfirmModal({
      isOpen: true,
      type: "complete_order",
      payload: orderId,
      title: "Pesanan Diterima?",
      message: `Pastikan barang dari pesanan ${invoiceNumber} sudah Anda terima dengan baik sebelum mengeklik Ya.`,
    });
  };

  const executeConfirmAction = async () => {
    if (confirmModal.type === "logout") {
      logout();
      clearCart();
      clearWishlist();
      addToast("Anda berhasil keluar.", "info");
      router.push("/");
    } else if (confirmModal.type === "cancel_order") {
      setIsProcessingAction(true);
      try {
        const orderId = confirmModal.payload;
        const targetOrder = orders.find((o) => o.id === orderId);

        const { error } = await supabase
          .from("orders")
          .update({ status: "CANCELED" })
          .eq("id", orderId);
        if (error) throw error;

        let itemsToRestore = typeof targetOrder.items === "string" ? JSON.parse(targetOrder.items) : targetOrder.items;
        await restoreOrderStock(itemsToRestore);

        setOrders(orders.map((o) => o.id === orderId ? { ...o, status: "CANCELED" } : o));
        addToast(`Pesanan berhasil dibatalkan. Stok dikembalikan.`, "success");
        setConfirmModal({ ...confirmModal, isOpen: false });
      } catch {
        addToast("Gagal membatalkan pesanan.", "error");
      } finally {
        setIsProcessingAction(false);
      }
    } else if (confirmModal.type === "complete_order") {
      setIsProcessingAction(true);
      try {
        const orderId = confirmModal.payload;
        const { error } = await supabase
          .from("orders")
          .update({ status: "COMPLETED" })
          .eq("id", orderId);
        if (error) throw error;

        setOrders(orders.map((o) => o.id === orderId ? { ...o, status: "COMPLETED" } : o));
        addToast(`Pesanan Selesai! Silakan berikan ulasan Anda di halaman produk.`, "success");
        setConfirmModal({ ...confirmModal, isOpen: false });
      } catch {
        addToast("Gagal menyelesaikan pesanan.", "error");
      } finally {
        setIsProcessingAction(false);
      }
    }
  };

  const formatRupiah = (number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);
  
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  
  const getDueDate = (createdAt) => {
    const date = new Date(new Date(createdAt).getTime() + PAYMENT_TIMEOUT_MS);
    return date.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "PAID":
      case "SUCCESS":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold w-fit"><CheckCircle className="w-3.5 h-3.5" /> LUNAS</span>;
      case "PROCESSING":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold w-fit"><Package className="w-3.5 h-3.5" /> SEDANG DIKEMAS</span>;
      case "DIKIRIM":
      case "SHIPPED":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold w-fit"><Truck className="w-3.5 h-3.5" /> DIKIRIM</span>;
      case "COMPLETED":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold w-fit"><ShieldCheck className="w-3.5 h-3.5" /> SELESAI</span>;
      case "PENDING_PAYMENT":
      case "PENDING":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold w-fit"><Clock className="w-3.5 h-3.5" /> MENUNGGU PEMBAYARAN</span>;
      case "CANCELED":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold w-fit"><XCircle className="w-3.5 h-3.5" /> DIBATALKAN</span>;
      case "EXPIRED":
      case "FAILED":
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold w-fit"><AlertTriangle className="w-3.5 h-3.5" /> KEDALUWARSA</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold w-fit">{status}</span>;
    }
  };

  // LAYAR LOADING SAAT MENGECEK SESI LOGIKA AUTH
  if (!isClient || !isInitialized || !user) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-24 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-20 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
          Akun Saya
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* KOLOM KIRI: Navigasi Profil */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center font-black text-2xl mb-4 uppercase tracking-widest">
              {user.name ? user.name.charAt(0) : "W"}
            </div>
            <h2 className="font-bold text-foreground text-lg">
              {user.name || "Pengguna Warhope"}
            </h2>
            <p className="text-sm text-foreground/60 mb-6">{user.email}</p>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Member
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all w-full text-left ${activeTab === "orders" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "text-foreground/70 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-foreground"}`}
            >
              <Package className="w-5 h-5" /> Pesanan Saya
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all w-full text-left ${activeTab === "settings" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "text-foreground/70 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-foreground"}`}
            >
              <Settings className="w-5 h-5" /> Pengaturan
            </button>
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
            <button
              onClick={promptLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all w-full text-left"
            >
              <LogOut className="w-5 h-5" /> Keluar
            </button>
          </div>
        </div>

        {/* KOLOM KANAN: Konten Tab */}
        <div className="lg:col-span-9">
          
          {/* TAB PESANAN SAYA */}
          {activeTab === "orders" && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-xl font-bold tracking-tight text-foreground mb-6">
                Riwayat Pesanan
              </h2>

              {isLoadingOrders ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-foreground/60 text-sm">
                    Memuat pesanan Anda...
                  </p>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center shadow-sm">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    Belum ada pesanan
                  </h3>
                  <p className="text-foreground/60 mb-8 max-w-sm">
                    Anda belum melakukan transaksi apa pun. Yuk, wujudkan gaya urban Anda sekarang!
                  </p>
                  <Link href="/katalog" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all active:scale-95">
                    Mulai Belanja
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => {
                    let items = [];
                    try {
                      items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
                    } catch (err) {
                      console.error("Parse items error:", err);
                    }

                    const isPending = order.status === "PENDING" || order.status === "PENDING_PAYMENT";
                    const isDikirim = order.status === "DIKIRIM" || order.status === "SHIPPED";

                    return (
                      <div key={order.id} className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm transition-all ${isPending ? "border-amber-200 dark:border-amber-900/50 shadow-amber-900/5" : isDikirim ? "border-blue-200 dark:border-blue-900/50" : "border-slate-200 dark:border-slate-800"}`}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 gap-4">
                          <div>
                            <p className="text-xs text-foreground/50 uppercase tracking-widest mb-1">
                              Tanggal Pesanan: <span className="font-bold text-foreground/80">{formatDate(order.created_at)}</span>
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="font-black text-foreground">
                                {order.invoice_number}
                              </h3>
                              {getStatusBadge(order.status)}
                            </div>
                          </div>
                          <div className="text-left md:text-right">
                            <p className="text-xs text-foreground/50 uppercase tracking-widest mb-1">Total Belanja</p>
                            <p className="font-black text-blue-600 dark:text-blue-400 text-lg">
                              {formatRupiah(order.total_amount)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-2xl border border-transparent dark:border-slate-800/50">
                              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-foreground text-sm line-clamp-1">{item.name}</h4>
                                <p className="text-[11px] text-foreground/60 mt-1 uppercase tracking-widest font-bold">
                                  Size: {item.selectedSize}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-foreground">{item.quantity}x</p>
                                <p className="text-xs font-bold text-foreground/60 mt-1">
                                  {formatRupiah(item.recordedPrice ?? item.final_price ?? item.price)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {isPending && (
                          <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                            <div>
                              <p className="text-xs font-bold text-amber-800 dark:text-amber-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                                <Clock className="w-3 h-3" /> Batas Waktu Pembayaran
                              </p>
                              <p className="text-sm font-black text-amber-900 dark:text-amber-400">
                                {getDueDate(order.created_at)} WIB
                              </p>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <button onClick={() => promptCancelOrder(order.id, order.invoice_number)} className="flex-1 sm:flex-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-full font-bold text-sm hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
                                Batalkan
                              </button>
                              <button onClick={() => { if (order.payment_url) window.location.href = order.payment_url; else addToast("Link pembayaran tidak ditemukan. Silakan hubungi CS Warhope.", "error"); }} className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2">
                                <CreditCard className="w-4 h-4" /> Bayar
                              </button>
                            </div>
                          </div>
                        )}

                        {isDikirim && (
                          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
                            <button onClick={() => promptCompleteOrder(order.id, order.invoice_number)} className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-green-700 transition-all shadow-md active:scale-95">
                              <CheckCircle className="w-4 h-4 inline-block mr-2" /> Pesanan Diterima
                            </button>
                          </div>
                        )}

                        {order.status === "COMPLETED" && (
                          <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
                            <Link href="/katalog" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-2">
                              Beli Lagi <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB PENGATURAN AKUN */}
          {activeTab === "settings" && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-xl font-bold tracking-tight text-foreground mb-6">
                Pengaturan Akun
              </h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                
                <div>
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Nama Lengkap</label>
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                    <User className="w-5 h-5 text-slate-400 mr-3" />
                    <input type="text" name="name" value={profileForm.name} onChange={handleProfileChange} className="bg-transparent w-full outline-none text-foreground text-sm font-medium" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Alamat Email</label>
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 opacity-70 cursor-not-allowed">
                    <Mail className="w-5 h-5 text-slate-400 mr-3" />
                    <input type="email" value={user.email || ""} readOnly className="bg-transparent w-full outline-none text-foreground text-sm font-medium cursor-not-allowed" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">*Email terikat dengan identitas masuk dan tidak dapat diubah.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Nomor Telepon / WhatsApp</label>
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                    <Phone className="w-5 h-5 text-slate-400 mr-3" />
                    <input type="tel" name="phone_number" value={profileForm.phone_number} onChange={handleProfileChange} placeholder="Contoh: 081234567890" className="bg-transparent w-full outline-none text-foreground text-sm font-medium" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Alamat Pengiriman Utama</label>
                  <div className="flex items-start bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                    <MapPin className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                    <textarea rows={3} name="address" value={profileForm.address} onChange={handleProfileChange} placeholder="Masukkan alamat lengkap (Jalan, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos)" className="bg-transparent w-full outline-none text-foreground text-sm font-medium resize-none"></textarea>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-md active:scale-95 disabled:opacity-70 flex items-center gap-2">
                    {isSavingProfile ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan Perubahan</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CUSTOM UNTUK KONFIRMASI LOGOUT & BATAL PESANAN */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmModal.type === "logout" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : confirmModal.type === "complete_order" ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-red-100 dark:bg-red-900/30 text-red-600"}`}>
                {confirmModal.type === "logout" ? <LogOut className="w-8 h-8" /> : confirmModal.type === "complete_order" ? <CheckCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{confirmModal.title}</h3>
              <p className="text-foreground/60 text-sm mb-8 whitespace-pre-line leading-relaxed">{confirmModal.message}</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="flex-1 py-3 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Batal</button>
                <button onClick={executeConfirmAction} disabled={isProcessingAction} className={`flex-1 py-3 rounded-full font-bold text-white transition-colors disabled:opacity-70 shadow-lg ${confirmModal.type === "logout" ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20" : confirmModal.type === "complete_order" ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"}`}>
                  {isProcessingAction ? "Memproses..." : "Ya, Lanjutkan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}