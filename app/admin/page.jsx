"use client";

import React, { useMemo } from "react";
import useSWR from "swr";
import {
  BarChart3, Award, RefreshCw, DollarSign, 
  ShoppingBag, Clock, AlertTriangle, CheckCircle, Lock
} from "lucide-react";
import Image from "next/image";

import { formatRupiah, formatDate, getStatusBadge } from "./utils";
import { supabase } from "../../lib/supabase"; 
import { useToastStore } from "../../store/toastStore";
import { useAuthStore } from "../../store/authStore";

const SKELETON_HEIGHTS = [30, 60, 40, 70, 50, 80, 20, 90, 40, 60, 50, 70];
const EMPTY_ARRAY = [];

// ✅ 1. FETCHER SUPER RINGAN: Hanya menarik kolom yang dibutuhkan untuk Dashboard
const fetchDashboardData = async () => {
  const [ordersRes, productsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, invoice_number, customer_name, status, total_amount, created_at, items')
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      // MENGHILANGKAN kolom 'description' dan 'sizes' yang membuat lambat!
      .select('id, name, stock, image, category, price, discount, final_price') 
  ]);

  if (ordersRes.error) throw ordersRes.error;
  if (productsRes.error) throw productsRes.error;

  return {
    orders: ordersRes.data || [],
    products: productsRes.data || [],
  };
};

const MetricSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0"></div>
    <div className="space-y-2 flex-1">
      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-1/2"></div>
      <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-3/4"></div>
    </div>
  </div>
);

export default function AdminDashboardPage() {
  const addToast = useToastStore((state) => state.addToast);
  const { user } = useAuthStore();
  const userRole = user?.role?.toLowerCase() || 'customer';
  const isSuperAdmin = userRole === 'superadmin' || userRole === 'admin';

  // ✅ 2. SWR TINGKAT LANJUT: Cegah re-fetch berulang dengan memori cache (deduping)
  const { 
    data, 
    isLoading,    
    isValidating, 
    mutate        
  } = useSWR(
    "admin-dashboard-stats-light", 
    fetchDashboardData,      
    {
      revalidateOnFocus: false, 
      revalidateIfStale: false, 
      keepPreviousData: true, // UX: Jangan hilangkan data lama saat me-refresh latar belakang
      dedupingInterval: 60000, // UX: Cache dipertahankan 60 detik saat pindah menu
      onError: (error) => {
        console.error("Gagal memuat data dasbor:", error);
        addToast("Gagal memuat data ringkasan.", "error");
      }
    }
  );

  const orders = data?.orders || EMPTY_ARRAY;
  const products = data?.products || EMPTY_ARRAY;

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];

  const dashboardStats = useMemo(() => {
    if (isLoading && !data) return null; 

    const successfulStatuses = ["PAID", "SUCCESS", "PROCESSING", "SHIPPED", "COMPLETED"];
    const paidOrders = orders.filter((o) => successfulStatuses.includes(o.status?.toUpperCase()));
    const totalRevenue = paidOrders.reduce((acc, curr) => acc + (parseInt(curr.total_amount) || 0), 0);
    const totalOrders = orders.length;
    const pendingOrdersCount = orders.filter((o) => ["PENDING_PAYMENT", "PENDING"].includes(o.status?.toUpperCase())).length;

    const safeProducts = Array.isArray(products) ? products : [];
    const lowStockItems = safeProducts.filter((p) => (parseInt(p.stock) || 0) <= 5);
    const lowStockCount = lowStockItems.length;
    const lowStockProducts = lowStockItems.slice(0, 4);

    const monthlyRevenue = Array(12).fill(0);
    paidOrders.forEach((o) => {
      const month = new Date(o.created_at).getMonth();
      monthlyRevenue[month] += parseInt(o.total_amount) || 0;
    });
    const maxMonthlyRevenue = Math.max(...monthlyRevenue, 1);

    const productSales = {};
    paidOrders.forEach((o) => {
      let items = [];
      try { items = typeof o.items === "string" ? JSON.parse(o.items) : o.items; } catch {}
      items.forEach((item) => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            id: item.id, name: item.name, image: item.image, category: item.category, soldQty: 0, revenue: 0,
          };
        }
        productSales[item.id].soldQty += item.quantity || 1;
        const purchasePrice = item.recordedPrice ?? item.final_price ?? item.price;
        productSales[item.id].revenue += purchasePrice * (item.quantity || 1);
      });
    });

    const topProducts = Object.values(productSales).sort((a, b) => b.soldQty - a.soldQty).slice(0, 5);

    return {
      totalRevenue, totalOrders, pendingOrdersCount, monthlyRevenue, maxMonthlyRevenue, topProducts, lowStockCount, lowStockProducts,
    };
  }, [orders, products, isLoading, data]);

  const recentOrders = useMemo(() => {
    return [...orders].slice(0, 5);
  }, [orders]);

  return (
    <div className="animate-in fade-in duration-500 pb-16">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Ringkasan Bisnis</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pantau performa penjualan dan statistik utama toko Anda.</p>
        </div>
        <button
          onClick={() => mutate()}
          disabled={isValidating}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-full font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} /> 
          {isValidating ? 'Memperbarui...' : 'Perbarui Data'}
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {(isLoading && !data) || !dashboardStats ? (
          <><MetricSkeleton /><MetricSkeleton /><MetricSkeleton /><MetricSkeleton /></>
        ) : (
          <>
            {isSuperAdmin && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group">
                <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-7 h-7" />
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 truncate">Pendapatan</p>
                  <h3 className="text-xl font-black text-foreground truncate">{formatRupiah(dashboardStats.totalRevenue)}</h3>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Pesanan</p>
                <h3 className="text-xl font-black text-foreground">{dashboardStats.totalOrders} <span className="text-xs font-medium text-slate-400">Trx</span></h3>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Pending</p>
                <h3 className="text-xl font-black text-foreground">{dashboardStats.pendingOrdersCount}</h3>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${dashboardStats.lowStockCount > 0 ? "bg-red-50 dark:bg-red-900/20 text-red-600" : "bg-slate-50 dark:bg-slate-800 text-slate-400"}`}>
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Stok {"<5"}</p>
                <h3 className={`text-xl font-black ${dashboardStats.lowStockCount > 0 ? "text-red-500 dark:text-red-400" : "text-foreground"}`}>
                  {dashboardStats.lowStockCount} <span className="text-xs font-medium text-slate-400">Item</span>
                </h3>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {isSuperAdmin ? (
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 md:p-8 flex flex-col min-h-87.5">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" /> Pendapatan Bulanan ({new Date().getFullYear()})
              </h3>
            </div>
            
            {(isLoading && !data) || !dashboardStats ? (
              <div className="flex-1 flex items-end gap-4 h-64 mt-auto border-b border-slate-100 dark:border-slate-800 pb-2">
                 {SKELETON_HEIGHTS.map((height, i) => (
                   <div key={i} className="flex-1 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-t-md" style={{ height: `${height}%` }}></div>
                 ))}
              </div>
            ) : (
              <div className="flex-1 flex items-end gap-2 sm:gap-4 h-64 mt-auto border-b border-slate-100 dark:border-slate-800 pb-2">
                {dashboardStats.monthlyRevenue.map((val, idx) => {
                  const heightPercentage = dashboardStats.maxMonthlyRevenue > 0 ? (val / dashboardStats.maxMonthlyRevenue) * 100 : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-slate-800 text-white text-xs font-bold py-1 px-2 rounded-md pointer-events-none transition-opacity whitespace-nowrap z-10">
                        {formatRupiah(val)}
                      </div>
                      <div className="w-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 rounded-t-md transition-all duration-500 min-h-1" style={{ height: `${heightPercentage}%` }}></div>
                      <span className="text-[10px] font-bold text-slate-400 mt-3 absolute -bottom-6">{monthNames[idx]}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 md:p-8 flex flex-col items-center justify-center min-h-87.5 text-center">
            <Lock className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-1">Grafik Finansial Dikunci</h3>
            <p className="text-sm text-slate-500">Anda tidak memiliki hak akses tingkat Superadmin untuk melihat metrik pendapatan.</p>
          </div>
        )}

        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 md:p-8 flex flex-col">
          <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" /> Produk Terlaris
          </h3>
          
          {(isLoading && !data) || !dashboardStats ? (
             <div className="space-y-4">
               {[...Array(4)].map((_, i) => (
                 <div key={i} className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0"></div>
                   <div className="flex-1 space-y-2">
                     <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-3/4"></div>
                     <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-1/2"></div>
                   </div>
                 </div>
               ))}
             </div>
          ) : dashboardStats.topProducts.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm flex-1 flex flex-col items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-slate-300 mb-2" />
              <p>Belum ada data penjualan.</p>
            </div>
          ) : (
            <div className="space-y-5 flex-1">
              {dashboardStats.topProducts.map((prod, idx) => (
                <div key={prod.id} className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                      <Image src={prod.image || '/placeholder.png'} alt={prod.name} width={48} height={48} className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute -top-2 -left-2 w-5 h-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white dark:border-slate-900 shadow-sm">{idx + 1}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-sm text-foreground truncate">{prod.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{prod.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-blue-600 dark:text-blue-400 text-sm">{prod.soldQty} Terjual</p>
                    {isSuperAdmin && (
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{formatRupiah(prod.revenue)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-lg text-foreground">Aktivitas Pesanan Terkini</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Invoice & Waktu</th>
                  <th className="px-6 py-4">Nama Pelanggan</th>
                  <th className="px-6 py-4">Total Belanja</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(isLoading && !data) ? (
                   [...Array(3)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-24 mb-2"></div><div className="h-2 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-16"></div></td>
                      <td className="px-6 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-32"></div></td>
                      <td className="px-6 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-20"></div></td>
                      <td className="px-6 py-5"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse w-24"></div></td>
                    </tr>
                  ))
                ) : recentOrders.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">Belum ada aktivitas transaksi masuk.</td></tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground font-mono text-xs">{order.invoice_number}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{formatDate(order.created_at)}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">{order.customer_name}</td>
                      <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">{formatRupiah(order.total_amount)}</td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 md:p-8 flex flex-col">
          <h3 className="font-bold text-lg mb-1 text-red-500 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Restock Alert
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">Produk yang mendesak untuk diproduksi ulang.</p>
          
          <div className="space-y-4 flex-1">
            {(isLoading && !data) || !dashboardStats ? (
               [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0"></div>
                  <div className="flex-1 space-y-2"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-full"></div><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2"></div></div>
                </div>
              ))
            ) : dashboardStats.lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center p-4 h-full">
                <CheckCircle className="w-8 h-8 text-green-500 mb-2 opacity-50" />
                <p className="font-bold text-foreground">Gudang Aman</p>
                <p className="text-xs text-slate-500 mt-1">Ketersediaan stok tercukupi.</p>
              </div>
            ) : (
              dashboardStats.lowStockProducts.map((prod) => (
                <div key={prod.id} className="flex items-center gap-3 bg-red-50/50 dark:bg-red-900/10 p-3 rounded-2xl border border-red-100 dark:border-red-900/30">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-red-200 dark:border-red-800/50">
                    <Image src={prod.image || '/placeholder.png'} alt={prod.name} width={40} height={40} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-foreground truncate">{prod.name}</h4>
                    <p className="text-[10px] font-bold text-red-600 dark:text-red-400 mt-1">Sisa Stok: {prod.stock} pcs</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}