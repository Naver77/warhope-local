import React, { useMemo } from 'react';
import { 
  BarChart3, Award, RefreshCw, DollarSign, 
  ShoppingBag, Clock, Loader2, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { formatRupiah, formatDate, getStatusBadge } from '../utils'; // Pastikan utils.js memiliki fungsi ini

export default function DashboardTab({ orders = [], products = [], isLoading, onRefresh }) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const dashboardStats = useMemo(() => {
    // 1. Pesanan yang sudah valid/masuk uangnya (Real-Time)
    const successfulStatuses = ['PAID', 'SUCCESS', 'PROCESSING', 'SHIPPED', 'COMPLETED'];
    const paidOrders = orders.filter(o => successfulStatuses.includes(o.status?.toUpperCase()));
    
    const totalRevenue = paidOrders.reduce((acc, curr) => acc + (parseInt(curr.total_amount) || 0), 0);
    
    // 2. Matriks Pesanan & Pelanggan
    const totalOrders = orders.length;
    const pendingOrdersCount = orders.filter(o => ['PENDING_PAYMENT', 'PENDING'].includes(o.status?.toUpperCase())).length;
    const uniqueCustomers = new Set(orders.map(o => o.customer_email)).size;

    // 3. Matriks Stok Produk (Low Stock Alert)
    const lowStockItems = products.filter(p => (parseInt(p.stock) || 0) <= 5);
    const lowStockCount = lowStockItems.length;
    const lowStockProducts = lowStockItems.slice(0, 4);

    // 4. Grafik Bulanan
    const monthlyRevenue = Array(12).fill(0);
    paidOrders.forEach(o => {
      const month = new Date(o.created_at).getMonth(); 
      monthlyRevenue[month] += parseInt(o.total_amount) || 0;
    });
    const maxMonthlyRevenue = Math.max(...monthlyRevenue, 1); 

    // 5. Performa Produk (Best Seller)
    const productSales = {};
    paidOrders.forEach(o => {
      let items = [];
      try { items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items; } catch {}
      
      items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = { id: item.id, name: item.name, image: item.image, category: item.category, soldQty: 0, revenue: 0 };
        }
        productSales[item.id].soldQty += (item.quantity || 1);
        productSales[item.id].revenue += (item.price * (item.quantity || 1));
      });
    });

    const topProducts = Object.values(productSales).sort((a, b) => b.soldQty - a.soldQty).slice(0, 5);

    return { 
      totalRevenue, totalOrders, pendingOrdersCount, uniqueCustomers, 
      monthlyRevenue, maxMonthlyRevenue, topProducts,
      lowStockCount, lowStockProducts
    };
  }, [orders, products]);

  // 6. Mendapatkan 5 pesanan terbaru
  const recentOrders = useMemo(() => {
    return [...orders].slice(0, 5); // Data orders sudah diurutkan dari page.jsx
  }, [orders]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 text-sm font-medium">Menganalisa performa toko...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Ringkasan Bisnis</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pantau performa penjualan dan statistik utama toko Anda.</p>
        </div>
        <button onClick={onRefresh} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-full font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 text-foreground">
          <RefreshCw className="w-4 h-4" /> Perbarui Data
        </button>
      </header>

      {/* 4 KARTU METRIK UTAMA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group">
          <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><DollarSign className="w-7 h-7" /></div>
          <div><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Pendapatan</p><h3 className="text-xl font-black text-foreground truncate">{formatRupiah(dashboardStats.totalRevenue)}</h3></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><ShoppingBag className="w-7 h-7" /></div>
          <div><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Pesanan</p><h3 className="text-xl font-black text-foreground">{dashboardStats.totalOrders} <span className="text-xs font-medium text-slate-400">Transaksi</span></h3></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Clock className="w-7 h-7" /></div>
          <div><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Pesanan Pending</p><h3 className="text-xl font-black text-foreground">{dashboardStats.pendingOrdersCount}</h3></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${dashboardStats.lowStockCount > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}><AlertTriangle className="w-7 h-7" /></div>
          <div><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Stok Menipis ({"<5"})</p><h3 className={`text-xl font-black ${dashboardStats.lowStockCount > 0 ? 'text-red-500 dark:text-red-400' : 'text-foreground'}`}>{dashboardStats.lowStockCount} <span className="text-xs font-medium text-slate-400">Item</span></h3></div>
        </div>
      </div>

      {/* GRAFIK & PRODUK TERLARIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Grafik Pendapatan */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 md:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600" /> Pendapatan Bulanan ({new Date().getFullYear()})</h3>
          </div>
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
        </div>

        {/* Produk Terlaris */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 md:p-8 flex flex-col">
          <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" /> Produk Terlaris</h3>
          {dashboardStats.topProducts.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm flex-1 flex flex-col items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-slate-300 mb-2" />
              <p>Belum ada data penjualan.</p>
            </div>
          ) : (
            <div className="space-y-5 flex-1">
              {dashboardStats.topProducts.map((prod, idx) => (
                <div key={prod.id} className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute -top-2 -left-2 w-6 h-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center text-xs font-black border-2 border-white dark:border-slate-900 shadow-sm">{idx + 1}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-sm text-foreground truncate">{prod.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{prod.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-blue-600 dark:text-blue-400 text-sm">{prod.soldQty} Terjual</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{formatRupiah(prod.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PESANAN TERBARU & RESTOCK ALERT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Pesanan Terbaru */}
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
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground font-mono text-xs">{order.invoice_number}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">{order.customer_name}</td>
                    <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">{formatRupiah(order.total_amount)}</td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">Belum ada aktivitas transaksi masuk.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Restock Alert */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 md:p-8 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg mb-1 text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Restock Alert
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">Produk yang mendesak untuk diproduksi ulang.</p>
            
            <div className="space-y-4">
              {dashboardStats.lowStockProducts.map((prod) => (
                <div key={prod.id} className="flex items-center gap-3 bg-red-50/50 dark:bg-red-900/10 p-3 rounded-2xl border border-red-100 dark:border-red-900/30">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-red-200 dark:border-red-800/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-foreground truncate">{prod.name}</h4>
                    <p className="text-[10px] font-bold text-red-600 dark:text-red-400 mt-1">Sisa Stok: {prod.stock} pcs</p>
                  </div>
                </div>
              ))}
              {dashboardStats.lowStockProducts.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center p-4 h-full">
                  <CheckCircle className="w-8 h-8 text-green-500 mb-2 opacity-50" />
                  <p className="font-bold text-foreground">Gudang Aman</p>
                  <p className="text-xs text-slate-500 mt-1">Ketersediaan stok tercukupi.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              *Peringatan otomatis muncul jika total stok produk mencapai angka 5 atau kurang.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}