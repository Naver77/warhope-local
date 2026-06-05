"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "../../store/authStore";
import { useToastStore } from "../../store/toastStore";
import { getAllProducts, getAllOrders } from "../../lib/api";
import ProductReviews from "./components/ProductReviews";

import Sidebar from "./components/Sidebar";
import DashboardTab from "./components/DashboardTab";
import OrdersTab from "./components/OrdersTab";
import ProductsTab from "./components/ProductsTab";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isInitialized, checkAuth, logout } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState("dashboard");

  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // 1. PINDAHKAN DEKLARASI FUNGSI KE ATAS SINI
  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const data = await getAllOrders();
      setOrders(data || []);
    } catch (err) {
      console.error("Gagal memuat pesanan:", err);
      addToast("Gagal memuat data pesanan.", "error");
    } finally {
      setIsLoadingOrders(false);
    }
  }, [addToast]);

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const data = await getAllProducts();
      setProducts(data || []);
    } catch (err) {
      console.error("Gagal memuat produk:", err);
      addToast("Gagal memuat data produk.", "error");
    } finally {
      setIsLoadingProducts(false);
    }
  }, [addToast]);

  // 2. useEffect OTENTIKASI & PEMANGGILAN DATA DI BAWAHNYA
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        addToast("Silakan login terlebih dahulu.", "info");
        router.push("/auth/login");
      } else if (user.role !== "admin") {
        addToast("Akses ditolak! Anda bukan Admin.", "error");
        router.push("/");
      } else {
        // Sekarang React sudah tahu apa itu fetchOrders & fetchProducts
        fetchOrders();
        fetchProducts();
      }
    }
  }, [isInitialized, user, router, addToast, fetchOrders, fetchProducts]);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const handleRefreshAll = () => {
    fetchOrders();
    fetchProducts();
  };

  const pendingOrdersCount = orders.filter(
    (o) =>
      o.status === "PENDING_PAYMENT" ||
      o.status === "PAID" ||
      o.status === "PROCESSING",
  ).length;

  if (!isInitialized || user?.role !== "admin") {
    return (
      <div className="fixed inset-0 z-100 bg-slate-50 dark:bg-slate-900"></div>
    );
  }

  const isDashboardLoading = isLoadingOrders || isLoadingProducts;

  return (
    <div className="fixed inset-0 z-100 bg-slate-50 dark:bg-[#0A0A0A] flex flex-col md:flex-row font-sans overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        pendingOrdersCount={pendingOrdersCount}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 pb-24 custom-scrollbar">
          {activeTab === "dashboard" && (
            <DashboardTab
              orders={orders}
              products={products}
              isLoading={isDashboardLoading}
              onRefresh={handleRefreshAll}
            />
          )}

          {activeTab === "orders" && (
            <OrdersTab
              orders={orders}
              isLoadingOrders={isLoadingOrders}
              fetchOrders={fetchOrders}
            />
          )}

          {activeTab === "products" && (
            <ProductsTab
              products={products}
              isLoadingProducts={isLoadingProducts}
              fetchProducts={fetchProducts}
            />
          )}

          {activeTab === "products" && (
            <ProductsTab
              products={products}
              isLoadingProducts={isLoadingProducts}
              fetchProducts={fetchProducts}
            />
          )}

          {/* TAMPILAN JIKA TAB = REVIEWS */}
          {activeTab === "reviews" && <ProductReviews />}
        </main>

        <footer className="absolute bottom-0 w-full py-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-center shrink-0 z-10">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} Warhope Apparel. Internal
            Management System.
          </p>
        </footer>
      </div>
    </div>
  );
}
