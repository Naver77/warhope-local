"use client";

import React from "react";
import Link from "next/link";
import { 
  ShoppingBag, Clock, CheckCircle, Package, Truck, 
  ShieldCheck, XCircle, AlertTriangle, CreditCard, ArrowRight 
} from "lucide-react";

const PAYMENT_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export default function OrderHistoryTab({ 
  orders, 
  isLoadingOrders, 
  promptCancelOrder, 
  promptCompleteOrder,
  addToast 
}) {
  
  // Memindahkan fungsi format ke sini agar file lebih mandiri
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

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-xl font-bold tracking-tight text-foreground mb-6">Riwayat Pesanan</h2>

      {isLoadingOrders ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-foreground/60 text-sm">Memuat pesanan Anda...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center shadow-sm">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Belum ada pesanan</h3>
          <p className="text-foreground/60 mb-8 max-w-sm">Anda belum melakukan transaksi apa pun. Yuk, wujudkan gaya urban Anda sekarang!</p>
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
                      <h3 className="font-black text-foreground">{order.invoice_number}</h3>
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
                    {/* Tambahkan fallback (items || []) agar aman dari nilai null */}
                    {(items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-2xl">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground text-sm line-clamp-1">{item.name}</h4>
                        <p className="text-[11px] text-foreground/60 mt-1 uppercase tracking-widest font-bold">Size: {item.selectedSize}</p>
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
                      <button onClick={() => { if (order.payment_url) window.location.href = order.payment_url; else addToast("Link pembayaran tidak ditemukan.", "error"); }} className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2">
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
  );
}