"use client";

import React, { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";

import { useAuthStore } from "../../../store/authStore";
import { useToastStore } from "../../../store/toastStore";
import { supabase } from "../../../lib/supabase";
import { formatRupiah, formatDate, getStatusBadge } from "../utils";

import OrderDetailModal from "../../../components/admin/OrderDetailModal";
import OrderActionModal from "../../../components/admin/OrderActionModal";

// ✅ 1. FETCHER BARU: Menarik semua data tanpa batas untuk Admin
const fetchAllAdminOrders = async () => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export default function AdminOrdersPage() {
  const { user, isInitialized } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  // ✅ 2. DEFINISI HAK AKSES
  const userRole = user?.role?.toLowerCase() || "";
  const hasAdminAccess = isInitialized && user && ["superadmin", "admin_staff", "admin"].includes(userRole);
  
  // Hanya Superadmin & Admin yang bisa mengubah status pesanan
  const canEdit = ["superadmin", "admin"].includes(userRole);

  const {
    data: rawOrders = [],
    isLoading: isLoadingOrders,
    mutate,
  } = useSWR(hasAdminAccess ? "admin-orders-list-all" : null, fetchAllAdminOrders, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  const orders = useMemo(() => {
    return [...rawOrders].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  }, [rawOrders]);

  const [searchOrderTerm, setSearchOrderTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [actionModal, setActionModal] = useState({
    isOpen: false,
    orderId: null,
    newStatus: "",
    requiresResi: false,
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.invoice_number
          ?.toLowerCase()
          .includes(searchOrderTerm.toLowerCase()) ||
        order.customer_name
          ?.toLowerCase()
          .includes(searchOrderTerm.toLowerCase()),
    );
  }, [orders, searchOrderTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchOrderTerm]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length);
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const promptUpdateStatus = (newStatus) => {
    setActionModal({
      isOpen: true,
      orderId: selectedOrder.id,
      newStatus,
      requiresResi: newStatus === "shipped" || newStatus === "SHIPPED",
    });
  };

  const executeUpdateStatus = async (actionData) => {
    const { orderId, newStatus, requiresResi, trackingNumber, courier } = actionData;

    setIsUpdatingStatus(true);
    try {
      const payload = { status: newStatus.toLowerCase() };

      if (requiresResi && trackingNumber) {
        payload.tracking_number = trackingNumber.trim();
        payload.courier = courier;
        payload.shipped_at = new Date().toISOString();
      }

      const { data: updatedOrder, error } = await supabase
        .from("orders")
        .update(payload)
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;

      addToast(`Status pesanan diubah menjadi ${newStatus}`, "success");

      if (
        (newStatus === "shipped" || newStatus === "SHIPPED") &&
        payload.tracking_number &&
        updatedOrder
      ) {
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
          console.error("Gagal email", e);
        }
      }

      mutate();
      setSelectedOrder({ ...selectedOrder, ...payload });

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

  if (!isInitialized) return null;

  return (
    <div className="animate-in fade-in duration-300 pb-16">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Manajemen Pesanan
          </h2>
          <p className="text-slate-500 mt-1">
            Daftar semua transaksi yang masuk ke sistem.
          </p>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-foreground shrink-0">
            Daftar Transaksi ({filteredOrders.length})
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Invoice atau Nama..."
              value={searchOrderTerm}
              onChange={(e) => setSearchOrderTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-100">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
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
                    className="px-6 py-16 text-center text-slate-500"
                  >
                    Memuat data pesanan...
                  </td>
                </tr>
              ) : currentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-16 text-center text-slate-500 italic"
                  >
                    Tidak ada pesanan yang ditemukan.
                  </td>
                </tr>
              ) : (
                currentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold font-mono">
                        {order.invoice_number}
                      </p>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 mt-1">
                        {formatDate(order.created_at)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold">{order.customer_name}</p>
                      <p className="text-xs text-slate-500 max-w-50 truncate">
                        {order.shipping_address}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                      {formatRupiah(order.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                      {order.tracking_number && (
                        <p className="text-[10px] font-bold text-blue-600 mt-1.5 bg-blue-50 px-2 py-0.5 rounded inline-block">
                          {order.courier}: {order.tracking_number}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {/* ✅ 3. PEMBATASAN AKSI BERDASARKAN ROLE */}
                      {canEdit ? (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsOrderModalOpen(true);
                          }}
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Kelola Pesanan"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">View Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!isLoadingOrders && filteredOrders.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800/20">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Menampilkan{" "}
              <span className="font-bold text-foreground">
                {startIndex + 1}
              </span>{" "}
              hingga{" "}
              <span className="font-bold text-foreground">{endIndex}</span> dari{" "}
              <span className="font-bold text-foreground">
                {filteredOrders.length}
              </span>{" "}
              pesanan
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
                  if (
                    totalPages > 5 &&
                    Math.abs(pageNumber - currentPage) > 1 &&
                    pageNumber !== 1 &&
                    pageNumber !== totalPages
                  ) {
                    if (Math.abs(pageNumber - currentPage) === 2)
                      return (
                        <span key={pageNumber} className="text-slate-400">
                          ...
                        </span>
                      );
                    return null;
                  }
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${currentPage === pageNumber ? "bg-blue-600 text-white border border-blue-600 shadow-sm" : "bg-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
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

      {isOrderModalOpen && (
        <OrderDetailModal
          selectedOrder={selectedOrder}
          onClose={() => setIsOrderModalOpen(false)}
          onActionPrompt={promptUpdateStatus}
          isUpdatingStatus={isUpdatingStatus}
        />
      )}

      {actionModal.isOpen && (
        <OrderActionModal
          actionModal={actionModal}
          onClose={() =>
            setActionModal({
              isOpen: false,
              orderId: null,
              newStatus: "",
              requiresResi: false,
            })
          }
          onSubmit={executeUpdateStatus}
          isUpdatingStatus={isUpdatingStatus}
        />
      )}
    </div>
  );
}