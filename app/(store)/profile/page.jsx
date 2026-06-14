"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

import { useAuthStore } from "../../../store/authStore";
import { useToastStore } from "../../../store/toastStore";
import { useCartStore } from "../../../store/cartStore";
import { useWishlistStore } from "../../../store/wishlistStore";
import { supabase } from "../../../lib/supabase";
import { restoreOrderStock } from "../../../lib/api";

// Impor komponen dari folder private _components
import ProfileSidebar from "./_components/ProfileSidebar";
import OrderHistoryTab from "./_components/OrderHistoryTab";
import AccountSettingsTab from "./_components/AccountSettingsTab";

const PAYMENT_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export default function ProfilePage() {
  const router = useRouter();

  const { user, isInitialized, checkAuth, logout, updateUserProfile } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const clearCart = useCartStore((state) => state.clearCart);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  const [profileForm, setProfileForm] = useState({ name: "", phone_number: "", address: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, type: null, payload: null, title: "", message: "",
  });
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true);
      checkAuth();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkAuth]);

  useEffect(() => {
    if (isClient && isInitialized) {
      if (!user) {
        addToast("Silakan masuk (login) untuk mengakses profil Anda.", "error");
        router.replace("/auth/login");
        return;
      }

      const userRole = user.role?.toLowerCase() || 'member';
      const isAdminLevel = ['superadmin', 'admin_staff', 'admin'].includes(userRole);

      if (isAdminLevel) {
        router.replace("/admin");
        return;
      }

      const fullName = user.name || user.user_metadata?.full_name || user.user_metadata?.name || "";
      setProfileForm({ name: fullName, phone_number: user.phone_number || "", address: user.address || "" });

      if (!user.phone_number || !user.address) setActiveTab("settings");
    }
  }, [isClient, isInitialized, user, router, addToast]);

  useEffect(() => {
    const fetchMyOrders = async () => {
      if (!user?.id) return;
      setIsLoadingOrders(true);
      try {
        const { data, error } = await supabase
          .from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });

        if (error) throw error;

        let fetchedOrders = data || [];
        let hasExpiredUpdates = false;
        const now = new Date().getTime();

        fetchedOrders = await Promise.all(
          fetchedOrders.map(async (order) => {
            if (order.status === "PENDING_PAYMENT" || order.status === "PENDING") {
              const orderTime = new Date(order.created_at).getTime();
              if (now - orderTime > PAYMENT_TIMEOUT_MS) {
                await supabase.from("orders").update({ status: "EXPIRED" }).eq("id", order.id);
                hasExpiredUpdates = true;
                return { ...order, status: "EXPIRED" };
              }
            }
            return order;
          })
        );

        if (hasExpiredUpdates) addToast("Beberapa pesanan dibatalkan otomatis karena batas waktu.", "info");
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Gagal mengambil pesanan:", error);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    if (isClient && user) fetchMyOrders();
  }, [isClient, user, addToast]);

  const handleProfileChange = (e) => setProfileForm({ ...profileForm, [e.target.name]: e.target.value });

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSavingProfile(true);
    try {
      const { error } = await supabase.from("users").update({
        name: profileForm.name, phone_number: profileForm.phone_number, address: profileForm.address
      }).eq("id", user.id);

      if (error) throw error;
      updateUserProfile({ name: profileForm.name, phone_number: profileForm.phone_number, address: profileForm.address });
      addToast("Profil berhasil diperbarui!", "success");
    } catch (error) {
      console.error("Error update profil:", error); 
      addToast("Gagal memperbarui profil.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = (e) => setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  const handleUpdatePassword = async () => {
    if (passwordForm.newPassword.length < 6) return addToast("Kata sandi minimal 6 karakter.", "error");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return addToast("Konfirmasi kata sandi tidak cocok.", "error");

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      addToast("Kata sandi berhasil diperbarui!", "success");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      addToast(error.message || "Gagal memperbarui kata sandi.", "error");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const promptLogout = () => setConfirmModal({ isOpen: true, type: "logout", title: "Keluar Akun?", message: "Yakin ingin keluar?" });
  const promptCancelOrder = (id, inv) => setConfirmModal({ isOpen: true, type: "cancel_order", payload: id, title: "Batalkan Pesanan?", message: `Yakin membatalkan ${inv}?` });
  const promptCompleteOrder = (id, inv) => setConfirmModal({ isOpen: true, type: "complete_order", payload: id, title: "Pesanan Diterima?", message: `Pastikan pesanan ${inv} sudah Anda terima.` });

  const executeConfirmAction = async () => {
    if (confirmModal.type === "logout") {
      setIsProcessingAction(true);
      try {
        // ✅ 1. Bersihkan state global secara instan (0 detik)
        logout();
        clearCart();
        clearWishlist();
        
        // ✅ 2. Beri notifikasi, tutup modal, dan redirect secepat kilat
        addToast("Anda berhasil keluar.", "success");
        setConfirmModal({ ...confirmModal, isOpen: false });
        
        router.replace("/auth/login"); 
        router.refresh(); // Paksa Next.js membuang cache halaman profil
        
        // ✅ 3. FIRE-AND-FORGET: Hapus sesi dari Supabase di latar belakang
        // PERHATIKAN: Tidak ada kata 'await' di sini agar UI tidak memblokir!
        supabase.auth.signOut().catch((err) => console.error("Logout background error:", err));

      } catch (error) {
        console.error("Error saat logout:", error);
        router.replace("/auth/login"); 
      } finally {
        setIsProcessingAction(false);
      }
    } 
    else if (confirmModal.type === "cancel_order") {
      setIsProcessingAction(true);
      try {
        const orderId = confirmModal.payload;
        const targetOrder = orders.find((o) => o.id === orderId);
        const { error } = await supabase.from("orders").update({ status: "CANCELED" }).eq("id", orderId);
        if (error) throw error;

        let itemsToRestore = typeof targetOrder.items === "string" ? JSON.parse(targetOrder.items) : targetOrder.items;
        await restoreOrderStock(itemsToRestore);

        setOrders(orders.map((o) => o.id === orderId ? { ...o, status: "CANCELED" } : o));
        addToast(`Pesanan dibatalkan.`, "success");
        setConfirmModal({ ...confirmModal, isOpen: false });
      } catch {
        addToast("Gagal membatalkan.", "error");
      } finally {
        setIsProcessingAction(false);
      }
    } 
    else if (confirmModal.type === "complete_order") {
      setIsProcessingAction(true);
      try {
        const orderId = confirmModal.payload;
        const { error } = await supabase.from("orders").update({ status: "COMPLETED" }).eq("id", orderId);
        if (error) throw error;

        setOrders(orders.map((o) => o.id === orderId ? { ...o, status: "COMPLETED" } : o));
        addToast(`Pesanan Selesai!`, "success");
        setConfirmModal({ ...confirmModal, isOpen: false });
      } catch {
        addToast("Gagal menyelesaikan.", "error");
      } finally {
        setIsProcessingAction(false);
      }
    }
  };

  if (!isClient || !isInitialized || !user) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-24 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-20 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <ProfileSidebar user={user} profileName={profileForm.name} activeTab={activeTab} setActiveTab={setActiveTab} promptLogout={promptLogout} />

        <div className="lg:col-span-9">
          {activeTab === "orders" && (
            <OrderHistoryTab orders={orders} isLoadingOrders={isLoadingOrders} promptCancelOrder={promptCancelOrder} promptCompleteOrder={promptCompleteOrder} addToast={addToast} />
          )}

          {activeTab === "settings" && (
            <AccountSettingsTab user={user} profileForm={profileForm} handleProfileChange={handleProfileChange} handleSaveProfile={handleSaveProfile} isSavingProfile={isSavingProfile} passwordForm={passwordForm} handlePasswordChange={handlePasswordChange} handleUpdatePassword={handleUpdatePassword} isUpdatingPassword={isUpdatingPassword} />
          )}
        </div>
      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmModal.type === "logout" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : confirmModal.type === "complete_order" ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-red-100 dark:bg-red-900/30 text-red-600"}`}>
                {confirmModal.type === "logout" ? <LogOut className="w-8 h-8" /> : confirmModal.type === "complete_order" ? <CheckCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{confirmModal.title}</h3>
              <p className="text-foreground/60 text-sm mb-8 whitespace-pre-line leading-relaxed">{confirmModal.message}</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="flex-1 py-3 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Batal</button>
                <button onClick={executeConfirmAction} disabled={isProcessingAction} className={`flex-1 py-3 rounded-full font-bold text-white transition-colors disabled:opacity-70 shadow-lg flex items-center justify-center gap-2 ${confirmModal.type === "logout" ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20" : confirmModal.type === "complete_order" ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"}`}>
                  {isProcessingAction ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ya, Lanjutkan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}