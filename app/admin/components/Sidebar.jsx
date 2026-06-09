"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr"; // 1. Impor SWR untuk manajemen cache profesional
import {
  LayoutDashboard,
  ShoppingBag,
  PackageSearch,
  LogOut,
  Star,
} from "lucide-react";

import { useAuthStore } from "../../../store/authStore";
import { getAllOrders } from "../../../lib/api"; 

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  // -----------------------------------------------------------------
  // 2. IMPLEMENTASI SWR UNTUK BADGE SIDEBAR
  // -----------------------------------------------------------------
  // Mengambil data pesanan secara otomatis dan menyimpannya di cache global browser
  const { data: orders = [] } = useSWR(
    "admin-orders-list", // Kunci cache yang unik untuk data pesanan
    getAllOrders,        // Fungsi API untuk mengambil pesanan dari Supabase
    {
      revalidateOnFocus: false, // Mencegah reload berulang saat pindah tab browser
      revalidateIfStale: false, // Gunakan cache yang ada tanpa loading ulang jika komponen remount
    }
  );

  // -----------------------------------------------------------------
  // 3. KALKULASI BADGE MENGGUNAKAN useMemo
  // -----------------------------------------------------------------
  // Hanya menghitung ulang jika isi array 'orders' benar-benar berubah
  const pendingOrdersCount = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === "PENDING_PAYMENT" ||
        o.status === "PAID" ||
        o.status === "PROCESSING",
    ).length;
  }, [orders]);

  const confirmLogout = () => {
    const isConfirmed = window.confirm(
      "Apakah Anda yakin ingin keluar dari Panel Admin?",
    );
    if (isConfirmed) {
      logout();
      router.push("/auth/login");
    }
  };

  // Konfigurasi Menu Navigasi
  const navItems = [
    { name: "Ringkasan", href: "/admin", icon: LayoutDashboard },
    {
      name: "Pesanan Masuk",
      href: "/admin/orders",
      icon: ShoppingBag,
      badge: pendingOrdersCount, // Menggunakan hasil kalkulasi memo
    },
    { name: "Katalog Produk", href: "/admin/products", icon: PackageSearch },
    { name: "Ulasan Pembeli", href: "/admin/reviews", icon: Star },
  ];

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
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
          onClick={confirmLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" /> Keluar
        </button>
      </div>
    </aside>
  );
}