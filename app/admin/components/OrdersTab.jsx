import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  X,
  Truck,
  Clock,
  CheckCircle,
  MapPin,
  Mail,
  Phone,
  AlertTriangle,
  Send,
  Package, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { formatRupiah, formatDate, getStatusBadge } from "../utils";

import { useToastStore } from "../../../store/toastStore";
import { supabase } from "../../../lib/supabase";

export default function OrdersTab({ orders, isLoadingOrders, fetchOrders }) {
  const addToast = useToastStore((state) => state.addToast);
  const [searchOrderTerm, setSearchOrderTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // STATE PAGINASI
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // STATE BARU UNTUK CUSTOM MODAL CONFIRM & PROMPT
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    orderId: null,
    newStatus: "",
    requiresResi: false,
  });
  const [trackingInput, setTrackingInput] = useState("");

  const filteredOrders = orders.filter(
    (order) =>
      order.invoice_number
        ?.toLowerCase()
        .includes(searchOrderTerm.toLowerCase()) ||
      order.customer_name
        ?.toLowerCase()
        .includes(searchOrderTerm.toLowerCase()),
  );

  // Reset halaman ke 1 jika ada pencarian baru
  useEffect(() => {
    setCurrentPage(1);
  }, [searchOrderTerm]);

  // LOGIKA PAGINASI
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length);
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // 1. FUNGSI PEMICU MODAL
  const promptUpdateStatus = (orderId, newStatus) => {
    setTrackingInput(""); // Reset input resi
    setActionModal({
      isOpen: true,
      orderId,
      newStatus,
      requiresResi: newStatus === "SHIPPED", // Disesuaikan dengan DB: SHIPPED
    });
  };

  // 2. FUNGSI EKSEKUSI (Dijalankan dari dalam Modal)
  const executeUpdateStatus = async (e) => {
    if (e) e.preventDefault();
    const { orderId, newStatus, requiresResi } = actionModal;

    setIsUpdatingStatus(true);
    try {
      const payload = { status: newStatus };
      if (requiresResi && trackingInput.trim()) {
        payload.tracking_number = trackingInput.trim();
      }

      const { data: updatedOrder, error } = await supabase
        .from("orders")
        .update(payload)
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;

      addToast(`Status pesanan diubah menjadi ${newStatus}`, "success");

      // TEMBAK EMAIL RESI OTOMATIS
      if (newStatus === "SHIPPED" && payload.tracking_number && updatedOrder) {
        addToast("Mengirim notifikasi email ke pelanggan...", "info");
        try {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: updatedOrder.customer_email,
              subject: `Pesanan Dikirim! - ${updatedOrder.invoice_number}`,
              type: "SHIPPED",
              orderData: updatedOrder,
            }),
          });
        } catch (e) {
          console.error("Gagal mengirim email resi:", e);
        }
      }

      fetchOrders();
      setIsOrderModalOpen(false);
      setActionModal({
        isOpen: false,
        orderId: null,
        newStatus: "",
        requiresResi: false,
      });
    } catch (err) {
      console.error(err);
      addToast("Gagal memperbarui status.", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getOrderItems = () => {
    if (!selectedOrder?.items) return [];
    try {
      return typeof selectedOrder.items === "string"
        ? JSON.parse(selectedOrder.items)
        : selectedOrder.items;
    } catch {
      return [];
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Manajemen Pesanan
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Daftar semua transaksi yang masuk ke sistem.
          </p>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-foreground">
            Daftar Transaksi ({filteredOrders.length})
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Invoice atau Nama..."
              value={searchOrderTerm}
              onChange={(e) => setSearchOrderTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-100">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Invoice & Waktu</th>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4">Total Belanja</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoadingOrders ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Memuat data pesanan...
                  </td>
                </tr>
              ) : currentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Tidak ada data pesanan.
                  </td>
                </tr>
              ) : (
                currentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground">
                        {order.invoice_number}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDate(order.created_at)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">
                        {order.customer_name}
                      </p>
                      <p
                        className="text-xs text-slate-500 max-w-50 truncate mt-0.5"
                        title={order.shipping_address}
                      >
                        {order.shipping_address}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      {formatRupiah(order.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                      {order.tracking_number && (
                        <p className="text-[10px] font-bold text-blue-600 mt-1.5 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded inline-block">
                          Resi: {order.tracking_number}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsOrderModalOpen(true);
                        }}
                        className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER PAGINASI */}
        {!isLoadingOrders && filteredOrders.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800/20">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Menampilkan <span className="font-bold text-foreground">{startIndex + 1}</span> hingga <span className="font-bold text-foreground">{endIndex}</span> dari <span className="font-bold text-foreground">{filteredOrders.length}</span> pesanan
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1} 
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                {[...Array(totalPages)].map((_, idx) => {
                  const pageNumber = idx + 1;
                  // Logika penyembunyian angka halaman (ellipsis) jika terlalu banyak
                  if (totalPages > 5 && Math.abs(pageNumber - currentPage) > 1 && pageNumber !== 1 && pageNumber !== totalPages) {
                    if (Math.abs(pageNumber - currentPage) === 2) return <span key={pageNumber} className="text-slate-400">...</span>;
                    return null;
                  }
                  return (
                    <button 
                      key={pageNumber} 
                      onClick={() => setCurrentPage(pageNumber)} 
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${currentPage === pageNumber ? 'bg-blue-600 text-white border border-blue-600 shadow-sm' : 'bg-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages} 
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETAIL PESANAN */}
      {isOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div>
                <h3 className="text-2xl font-black text-foreground flex items-center gap-3">
                  {selectedOrder.invoice_number}{" "}
                  {getStatusBadge(selectedOrder.status)}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {formatDate(selectedOrder.created_at)}
                </p>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-white dark:bg-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                      Informasi Pelanggan
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl space-y-4 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-start gap-3">
                        <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm shrink-0">
                          <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Nama Lengkap</p>
                          <p className="font-bold text-foreground">
                            {selectedOrder.customer_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm shrink-0">
                          <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="font-bold text-foreground">
                            {selectedOrder.customer_email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm shrink-0">
                          <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            Nomor WhatsApp
                          </p>
                          <p className="font-bold text-foreground">
                            {selectedOrder.customer_phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm shrink-0">
                          <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            Alamat Pengiriman
                          </p>
                          <p className="font-bold text-foreground text-sm leading-relaxed">
                            {selectedOrder.shipping_address}
                          </p>
                        </div>
                      </div>

                      {selectedOrder.tracking_number && (
                        <div className="flex items-start gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm shrink-0">
                            <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Nomor Resi</p>
                            <p className="font-black tracking-wider text-blue-600 dark:text-blue-400">
                              {selectedOrder.tracking_number}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                    Rincian Belanja
                  </h4>
                  <div className="space-y-4 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
                    {getOrderItems().map((item, idx) => (
                      <div
                        key={idx}
                        className="flex gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                      >
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <h5 className="font-bold text-foreground text-sm leading-tight">
                            {item.name}
                          </h5>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300">
                              Size: {item.selectedSize}
                            </span>
                          </div>
                          <div className="flex justify-between items-end mt-2">
                            <span className="text-xs font-bold text-foreground">
                              Qty: {item.quantity}
                            </span>
                            <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                              {formatRupiah(item.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 bg-slate-900 dark:bg-black rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex justify-between items-center mb-2 text-slate-400 text-sm">
                      <span>Total Tagihan Dibayar</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-black text-blue-400">
                        {formatRupiah(selectedOrder.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center gap-4">
              {selectedOrder.status === "PENDING_PAYMENT" ? (
                <p className="text-sm text-amber-600 font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Menunggu pelanggan membayar.
                </p>
              ) : selectedOrder.status === "PAID" ? (
                <div className="flex items-center gap-3 w-full justify-end">
                  <p className="text-sm text-slate-500 mr-auto hidden sm:block">
                    Pesanan lunas. Segera siapkan pesanan.
                  </p>
                  <button
                    onClick={() =>
                      promptUpdateStatus(selectedOrder.id, "PROCESSING")
                    }
                    disabled={isUpdatingStatus}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUpdatingStatus ? (
                      "Memproses..."
                    ) : (
                      <>
                        <Package className="w-4 h-4" /> Proses Pesanan (Kemas)
                      </>
                    )}
                  </button>
                </div>
              ) : selectedOrder.status === "PROCESSING" ? (
                <div className="flex items-center gap-3 w-full justify-end">
                  <p className="text-sm text-slate-500 mr-auto hidden sm:block">
                    Pesanan sedang dikemas. Masukkan resi jika sudah diserahkan
                    ke kurir.
                  </p>
                  <button
                    onClick={() =>
                      promptUpdateStatus(selectedOrder.id, "SHIPPED")
                    }
                    disabled={isUpdatingStatus}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUpdatingStatus ? (
                      "Memproses..."
                    ) : (
                      <>
                        <Truck className="w-4 h-4" /> Kirim Pesanan (Input Resi)
                      </>
                    )}
                  </button>
                </div>
              ) : selectedOrder.status === "SHIPPED" ? (
                <p className="text-sm text-blue-600 font-bold flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Menunggu pelanggan mengonfirmasi
                  penerimaan barang.
                </p>
              ) : selectedOrder.status === "COMPLETED" ? (
                <p className="text-sm text-emerald-600 font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Pesanan Selesai.
                </p>
              ) : (
                <p className="text-sm font-bold text-foreground/50">
                  Status: {getStatusBadge(selectedOrder.status)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CUSTOM UNTUK KONFIRMASI & INPUT RESI */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-130 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                {actionModal.requiresResi ? (
                  <Send className="w-8 h-8" />
                ) : (
                  <AlertTriangle className="w-8 h-8" />
                )}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {actionModal.requiresResi ? "Kirim Pesanan" : "Konfirmasi Aksi"}
              </h3>
              <p className="text-foreground/60 text-sm mb-6">
                {actionModal.requiresResi
                  ? "Masukkan nomor resi pengiriman untuk memudahkan pelanggan melacak paketnya."
                  : `Anda yakin ingin mengubah status pesanan ini menjadi ${actionModal.newStatus}?`}
              </p>

              <form onSubmit={executeUpdateStatus}>
                {actionModal.requiresResi && (
                  <div className="mb-6 text-left">
                    <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">
                      Nomor Resi (Opsional)
                    </label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Contoh: JX1234567890"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground font-medium tracking-wide uppercase"
                    />
                  </div>
                )}

                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    onClick={() =>
                      setActionModal({
                        isOpen: false,
                        orderId: null,
                        newStatus: "",
                        requiresResi: false,
                      })
                    }
                    className="flex-1 py-3 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStatus}
                    className="flex-1 py-3 rounded-full font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-70 shadow-lg shadow-blue-600/20"
                  >
                    {isUpdatingStatus ? "Memproses..." : "Ya, Lanjutkan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}