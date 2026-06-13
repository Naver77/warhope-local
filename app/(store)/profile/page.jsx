"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/authStore";
import { useToastStore } from "../../../store/toastStore";
import { useCartStore } from "../../../store/cartStore";
import { useWishlistStore } from "../../../store/wishlistStore";

// Komponen Modular yang baru kita buat
import ProfileSidebar from "../../../components/profile/ProfileSidebar";
import OrdersTab from "../../../components/profile/OrdersTab";
import SettingsTab from "../../../components/profile/SettingsTab";
import ConfirmModal from "../../../components/profile/ConfirmModal";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isInitialized, checkAuth, logout } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const clearCart = useCartStore((state) => state.clearCart);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [logoutModal, setLogoutModal] = useState({ isOpen: false });

  // TRIGGER AWAL LOAD HALAMAN
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true);
      checkAuth();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkAuth]);

  // GERBANG UTAMA (VALIDASI LOGIN & ROLE)
  useEffect(() => {
    if (isClient && isInitialized) {
      if (!user) {
        addToast("Silakan masuk (login) untuk mengakses profil.", "error");
        router.replace("/auth/login");
        return;
      }
      const userRole = user.role?.toLowerCase() || 'customer';
      if (userRole === 'superadmin' || userRole === 'admin_staff' || userRole === 'admin') {
        router.replace("/admin");
        return;
      }
      if (!user.phone_number || !user.address) {
        setTimeout(() => setActiveTab("settings"), 0);
      }
    }
  }, [isClient, isInitialized, user, router, addToast]);

  const executeLogout = () => {
    logout();
    clearCart();
    clearWishlist();
    addToast("Anda berhasil keluar.", "info");
    router.push("/");
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
        <ProfileSidebar 
          user={user} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          promptLogout={() => setLogoutModal({ isOpen: true })} 
        />

        <div className="lg:col-span-9">
          {/* Render keduanya, tapi sembunyikan yang tidak aktif dengan CSS */}
          <div className={activeTab === "orders" ? "block animate-in fade-in duration-300" : "hidden"}>
            <OrdersTab user={user} />
          </div>
          <div className={activeTab === "settings" ? "block animate-in fade-in duration-300" : "hidden"}>
            <SettingsTab user={user} />
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={logoutModal.isOpen} 
        type="logout"
        title="Keluar Akun?" 
        message="Apakah Anda yakin ingin keluar dari akun Anda saat ini?" 
        onConfirm={executeLogout} 
        onCancel={() => setLogoutModal({ isOpen: false })} 
      />
    </main>
  );
}