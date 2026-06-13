import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  Star,
  ShieldCheck,
  ShoppingBag,
  X,
  CreditCard,
  ArrowRight,
} from "lucide-react";

// Perbaikan Jalur Import (Cukup 2 tingkat: ../../)
import { supabase } from "../../lib/supabase";
import {
  markOrderAsCompleted,
  submitReview,
  restoreOrderStock,
} from "../../lib/api";
import { useToastStore } from "../../store/toastStore";
import ConfirmModal from "./ConfirmModal";

const PAYMENT_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export default function OrdersTab({ user }) {
  const addToast = useToastStore((state) => state.addToast);

  // State Utama
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // State Modal Aksi (Batal / Selesai)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    payload: null,
    title: "",
    message: "",
  });
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // State Modal Ulasan (Review)
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    orderId: null,
    product: null,
  });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // ==========================================
  // 1. SISTEM FETCHING SILENT & AUTO-REFRESH
  // ==========================================
  useEffect(() => {
    const fetchMyOrders = async (isSilent = false) => {
      if (!user?.id) return;

      // Jika pesanan kosong dan tidak silent, tampilkan loading spinner
      if (!isSilent && orders.length === 0) setIsLoadingOrders(true);

      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const now = new Date().getTime();
        const expiredOrderIds = [];

        // Logika Eksekusi Kadaluwarsa Instan di Latar Belakang (Tanpa Blocking UX)
        const fetchedOrders = (data || []).map((order) => {
          if (
            order.status === "PENDING_PAYMENT" ||
            order.status === "PENDING"
          ) {
            const orderTime = new Date(order.created_at).getTime();
            if (now - orderTime > PAYMENT_TIMEOUT_MS) {
              expiredOrderIds.push(order.id);
              return { ...order, status: "EXPIRED" };
            }
          }
          return order;
        });

        // Fire and Forget update ke database
        if (expiredOrderIds.length > 0) {
          supabase
            .from("orders")
            .update({ status: "EXPIRED" })
            .in("id", expiredOrderIds);
          if (!isSilent)
            addToast(
              "Beberapa pesanan dibatalkan otomatis karena lewat batas waktu.",
              "info",
            );
        }

        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Gagal mengambil pesanan:", error);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchMyOrders(false); // Fetching awal saat render

    // Auto-Refresh Background saat user kembali buka tab browser
    const handleFocus = () => fetchMyOrders(true);
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ==========================================
  // 2. FUNGSI HANDLER & FORMATTER
  // ==========================================
  const formatRupiah = (number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const getDueDate = (createdAt) =>
    new Date(
      new Date(createdAt).getTime() + PAYMENT_TIMEOUT_MS,
    ).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusStep = (status) => {
    const s = String(status).toLowerCase();
    if (s === "pending_payment" || s === "pending") return 1;
    if (s === "paid" || s === "processing" || s === "packing") return 2;
    if (s === "shipped" || s === "dikirim") return 3;
    if (s === "completed") return 4;
    return 0; // Canceled / Expired
  };

  const handleCopyResi = (resi) => {
    navigator.clipboard.writeText(resi);
    addToast("Nomor resi disalin ke clipboard!", "success");
  };

  // ==========================================
  // 3. LOGIKA AKSI MODAL (BATAL & SELESAI)
  // ==========================================
  const promptCancelOrder = (orderId, invoiceNumber) => {
    setConfirmModal({
      isOpen: true,
      type: "cancel_order",
      payload: orderId,
      title: "Batalkan Pesanan?",
      message: `Anda yakin ingin membatalkan pesanan ${invoiceNumber}?`,
    });
  };

  const promptCompleteOrder = (orderId, invoiceNumber) => {
    setConfirmModal({
      isOpen: true,
      type: "complete_order",
      payload: orderId,
      title: "Pesanan Diterima?",
      message: `Pastikan barang pesanan ${invoiceNumber} sudah Anda terima dengan baik sebelum mengeklik Ya.`,
    });
  };

  const executeConfirmAction = async () => {
    setIsProcessingAction(true);
    try {
      const orderId = confirmModal.payload;

      if (confirmModal.type === "cancel_order") {
        const targetOrder = orders.find((o) => o.id === orderId);
        await supabase
          .from("orders")
          .update({ status: "CANCELED" })
          .eq("id", orderId);

        // Parsing aman + Rollback Stok
        let itemsToRestore = [];
        try {
          itemsToRestore =
            typeof targetOrder.items === "string"
              ? JSON.parse(targetOrder.items)
              : targetOrder.items;
        } catch {}
        await restoreOrderStock(itemsToRestore);

        setOrders(
          orders.map((o) =>
            o.id === orderId ? { ...o, status: "CANCELED" } : o,
          ),
        );
        addToast("Pesanan berhasil dibatalkan. Stok dikembalikan.", "success");
      } else if (confirmModal.type === "complete_order") {
        await markOrderAsCompleted(orderId);
        setOrders(
          orders.map((o) =>
            o.id === orderId ? { ...o, status: "COMPLETED" } : o,
          ),
        );
        addToast("Pesanan Selesai! Silakan berikan ulasan Anda.", "success");
      }

      setConfirmModal({ ...confirmModal, isOpen: false });
    } catch {
      addToast("Gagal memproses aksi pada pesanan.", "error");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // ==========================================
  // 4. LOGIKA MODAL ULASAN
  // ==========================================
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      addToast("Tulis ulasan Anda terlebih dahulu.", "error");
      return;
    }

    setIsProcessingAction(true);
    try {
      await submitReview({
        product_id: reviewModal.product.id,
        order_id: reviewModal.orderId,
        user_id: user.id,
        user_name: user.name || user.email.split("@")[0],
        rating: rating,
        comment: comment.trim(),
      });
      addToast("Ulasan berhasil dikirim! Terima kasih.", "success");
      setReviewModal({ isOpen: false, orderId: null, product: null });
      setRating(5);
      setComment("");
    } catch {
      addToast("Gagal mengirim ulasan.", "error");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // ==========================================
  // RENDER UI UTAMA
  // ==========================================
  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-xl font-bold tracking-tight text-foreground mb-6">
        Riwayat Pesanan
      </h2>

      {isLoadingOrders ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center shadow-sm">
          <ShoppingBag className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-6" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            Belum ada pesanan
          </h2>
          <p className="text-slate-500 mb-8 max-w-sm">
            Anda belum melakukan transaksi apa pun. Yuk, lihat koleksi terbaru
            kami!
          </p>
          <Link
            href="/katalog"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            Mulai Belanja
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const step = getStatusStep(order.status);
            const isCanceled = step === 0;
            const isPending = step === 1;

            let items = [];
            try {
              items =
                typeof order.items === "string"
                  ? JSON.parse(order.items)
                  : order.items;
            } catch {}

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      {formatDate(order.created_at)}
                    </p>
                    <p className="font-bold text-foreground text-lg flex items-center gap-2">
                      {order.invoice_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium mb-1">
                      Total Belanja
                    </p>
                    <p className="font-black text-blue-600 dark:text-blue-400 text-lg">
                      {formatRupiah(order.total_amount)}
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  {/* Progress Bar Status Pengiriman */}
                  {!isCanceled && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2 relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full z-0"></div>
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-1000"
                          style={{
                            width: `${Math.min((step - 1) * 33.33, 100)}%`,
                          }}
                        ></div>

                        <div
                          className={`relative z-10 flex flex-col items-center gap-2 ${step >= 1 ? "text-blue-600" : "text-slate-300 dark:text-slate-600"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${step >= 1 ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800"}`}
                          >
                            <Clock className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                            Dibayar
                          </span>
                        </div>

                        <div
                          className={`relative z-10 flex flex-col items-center gap-2 ${step >= 2 ? "text-blue-600" : "text-slate-300 dark:text-slate-600"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${step >= 2 ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800"}`}
                          >
                            <Package className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                            Dikemas
                          </span>
                        </div>

                        <div
                          className={`relative z-10 flex flex-col items-center gap-2 ${step >= 3 ? "text-blue-600" : "text-slate-300 dark:text-slate-600"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${step >= 3 ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800"}`}
                          >
                            <Truck className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                            Dikirim
                          </span>
                        </div>

                        <div
                          className={`relative z-10 flex flex-col items-center gap-2 ${step >= 4 ? "text-emerald-600" : "text-slate-300 dark:text-slate-600"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${step >= 4 ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800"}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                            Selesai
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isCanceled && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-2">
                      <X className="w-5 h-5" /> Pesanan ini Dibatalkan atau
                      Kedaluwarsa.
                    </div>
                  )}

                  {/* Lacak Resi */}
                  {order.tracking_number && step === 3 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-5 mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div>
                        <p className="text-xs text-blue-600/70 font-bold uppercase tracking-widest mb-1">
                          Dikirim via {order.courier || "Ekspedisi"}
                        </p>
                        <div className="flex items-center flex-wrap gap-2">
                          <p className="text-xl font-black text-blue-700 tracking-wider">
                            {order.tracking_number}
                          </p>
                          <button
                            onClick={() =>
                              handleCopyResi(order.tracking_number)
                            }
                            className="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                            title="Salin Resi"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-blue-600/70 mt-2">
                          Pesanan sedang dalam perjalanan ke alamat Anda.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
                        <a
                          href={`https://cekresi.com/?noresi=${order.tracking_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 px-6 py-3 rounded-full font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" /> Lacak Paket
                        </a>
                        <button
                          onClick={() =>
                            promptCompleteOrder(order.id, order.invoice_number)
                          }
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4" /> Pesanan Diterima
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Menunggu Pembayaran & Batalkan */}
                  {isPending && (
                    <div className="mt-2 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                      
                      {/* Bagian Kiri: Batas Waktu */}
                      <div>
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-500 flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3" /> Batas Waktu Pembayaran
                        </p>
                        <p className="text-sm font-black text-amber-900 dark:text-amber-400">
                          {getDueDate(order.created_at)} WIB
                        </p>
                      </div>

                      {/* Bagian Kanan: Tombol & Catatan Edukasi */}
                      <div className="w-full sm:w-auto text-left sm:text-right">
                        <div className="flex gap-3 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => promptCancelOrder(order.id, order.invoice_number)}
                            className="flex-1 sm:flex-none bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-full font-bold text-sm hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:border-red-900 transition-all"
                          >
                            Batalkan
                          </button>
                          <button
                            onClick={() => {
                              if (order.payment_url) {
                                window.location.href = order.payment_url;
                              } else {
                                addToast("Link pembayaran tidak ditemukan.", "error");
                              }
                            }}
                            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                          >
                            <CreditCard className="w-4 h-4" /> Lanjutkan Pembayaran
                          </button>
                        </div>
                        <p className="text-[10px] text-amber-700/60 dark:text-amber-500/60 font-bold mt-2.5 sm:mt-2 px-1">
                          *Instruksi & kode bayar juga dikirim ke email Anda.
                        </p>
                      </div>

                    </div>
                  )}

                  {/* Daftar Item Pesanan */}
                  <div className="space-y-4">
                    {/* Perbaikan Optional Chaining */}
                    {items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
                      >
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <h4 className="font-bold text-foreground text-sm">
                            {item.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Size: {item.selectedSize}{" "}
                            <span className="mx-2">•</span> Qty: {item.quantity}
                          </p>
                        </div>

                        {step === 4 && (
                          <div className="flex items-center sm:items-end">
                            <button
                              onClick={() =>
                                setReviewModal({
                                  isOpen: true,
                                  orderId: order.id,
                                  product: item,
                                })
                              }
                              className="w-full sm:w-auto px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                            >
                              <Star className="w-4 h-4" /> Beri Ulasan
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {step === 4 && (
                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <Link
                        href="/katalog"
                        className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-2"
                      >
                        Beli Lagi <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Komponen Modal Aksi (Batal / Selesai) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={executeConfirmAction}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        isProcessing={isProcessingAction}
      />

      {/* Modal Review Ulasan Bintang */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-foreground mb-1">
              Nilai Produk Ini
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Bagaimana kualitas {reviewModal.product?.name}?
            </p>

            <form onSubmit={handleSubmitReview}>
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`p-2 transition-transform hover:scale-110 ${star <= rating ? "text-amber-400" : "text-slate-200 dark:text-slate-700"}`}
                  >
                    <Star className="w-10 h-10 fill-current" />
                  </button>
                ))}
              </div>

              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ceritakan pengalaman Anda memakai produk ini..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground resize-none mb-6"
              ></textarea>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={() =>
                    setReviewModal({
                      isOpen: false,
                      orderId: null,
                      product: null,
                    })
                  }
                  className="flex-1 py-3 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="flex-1 py-3 rounded-full font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {isProcessingAction ? "Menyimpan..." : "Kirim Ulasan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
