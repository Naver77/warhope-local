"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; 
import useSWR from "swr"; 
import {
  LayoutDashboard,
  ShoppingBag,
  PackageSearch,
  LogOut,
  Star,
  Loader2
} from "lucide-react";

import { useAuthStore } from "../../../store/authStore";
import { getAllOrders } from "../../../lib/api"; 
// ✅ 1. WAJIB IMPOR SUPABASE UNTUK MENGHANCURKAN TOKEN ASLI
import { supabase } from "../../../lib/supabase"; 

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); 

  const { data: orders = [] } = useSWR(
    "admin-orders-list",
    getAllOrders,      
    {
      revalidateOnFocus: false, 
      revalidateIfStale: false, 
    }
  );

  const pendingOrdersCount = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === "PENDING_PAYMENT" ||
        o.status === "PAID" ||
        o.status === "PROCESSING",
    ).length;
  }, [orders]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  // ✅ 2. PEMBERSIHAN SESI TOTAL (NUCLEAR LOGOUT)
  const executeLogout = async () => {
    setIsLoggingOut(true); 
    
    // Matikan jebakan keamanan navigasi
    window.__ALLOW_LEAVE__ = true;
    
    try {
      // a. Hancurkan token langsung di server Supabase (Paling Penting!)
      await supabase.auth.signOut();
      
      // b. Kosongkan state di Zustand
      await logout();
      
      // c. Bersihkan seluruh Cache, LocalStorage, dan SessionStorage browser
      // Ini memastikan tidak ada satupun "Ghost Token" yang tertinggal
      if (typeof window !== "undefined") {
        window.localStorage.clear();
        window.sessionStorage.clear();
      }
    } catch (error) {
      console.error("Gagal membersihkan sesi secara total:", error);
    }
    
    // Hard Redirect ke Beranda
    window.location.href = "/";
  };

  const navItems = [
    { name: "Ringkasan", href: "/admin", icon: LayoutDashboard },
    {
      name: "Pesanan Masuk",
      href: "/admin/orders",
      icon: ShoppingBag,
      badge: pendingOrdersCount,
    },
    { name: "Katalog Produk", href: "/admin/products", icon: PackageSearch },
    { name: "Ulasan Pembeli", href: "/admin/reviews", icon: Star },
  ];

  return (
    <>
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 relative z-40">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between md:justify-start">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/warhope-clear.PNG"
              alt="Warhope Logo"
              className="h-4 md:h-6 w-auto object-contain dark:invert transition-all hover:scale-105"
            />
            <span className="text-[10px] font-black px-2 py-1 bg-blue-100 text-blue-600 rounded-md hidden lg:inline-block tracking-widest">
              ADMIN
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 flex md:flex-col gap-2 overflow-x-auto hide-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="hidden sm:inline-block">{item.name}</span>
                </div>
                {item.badge > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2 hidden md:block">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" /> Keluar Akun
          </button>
        </div>
      </aside>

      {showLogoutModal && (
        <div className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogOut className="w-10 h-10 ml-1" />
            </div>

            <h2 className="text-2xl font-black text-foreground mb-3 tracking-tight">
              Akhiri Sesi Admin?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
              Anda akan dikeluarkan dari sistem dasbor dan diarahkan ke beranda. Pastikan semua pekerjaan telah tersimpan.
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={executeLogout}
                disabled={isLoggingOut}
                className="w-full py-4 rounded-2xl font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg shadow-red-600/20 active:scale-95 text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Menghancurkan Sesi...</>
                ) : (
                  "Ya, Keluar Akun"
                )}
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="w-full py-4 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 text-sm disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}