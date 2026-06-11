import React from "react";
import Image from "next/image";
import { X, CheckCircle, Mail, Phone, MapPin, Truck, Clock, Package, ShieldCheck } from "lucide-react";
import { formatRupiah, formatDate, getStatusBadge } from "../../app/admin/utils";

export default function OrderDetailModal({ 
  selectedOrder, 
  onClose, 
  onActionPrompt, 
  isUpdatingStatus 
}) {
  if (!selectedOrder) return null;

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
    <div className="fixed inset-0 z-120 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header Modal */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div>
            <h3 className="text-2xl font-black text-foreground flex flex-wrap items-center gap-3">
              {selectedOrder.invoice_number} {getStatusBadge(selectedOrder.status)}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {formatDate(selectedOrder.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Konten Modal */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-white dark:bg-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Info Pelanggan */}
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
                      <p className="font-bold text-foreground">{selectedOrder.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm shrink-0">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="font-bold text-foreground">{selectedOrder.customer_email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm shrink-0">
                      <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Nomor WhatsApp</p>
                      <p className="font-bold text-foreground">{selectedOrder.customer_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm shrink-0">
                      <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Alamat Pengiriman</p>
                      <p className="font-bold text-foreground text-sm leading-relaxed">
                        {selectedOrder.shipping_address}
                      </p>
                    </div>
                  </div>

                  {/* Tampilkan Resi & Kurir Jika Ada */}
                  {selectedOrder.tracking_number && (
                    <div className="flex items-start gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm shrink-0">
                        <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">
                          {selectedOrder.courier ? `Kurir: ${selectedOrder.courier}` : "Nomor Resi"}
                        </p>
                        <p className="font-black tracking-wider text-blue-600 dark:text-blue-400">
                          {selectedOrder.tracking_number}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rincian Belanja */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                Rincian Belanja
              </h4>
              <div className="space-y-4 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
                {getOrderItems().map((item, idx) => {
                  
                  // PERBAIKAN: Menentukan harga dengan presisi (Memprioritaskan price_at_purchase)
                  const itemFinalPrice = Number(item.price_at_purchase ?? item.finalPrice ?? item.final_price ?? item.price);
                  const itemOriginalPrice = Number(item.price);
                  const isDiscounted = itemFinalPrice < itemOriginalPrice;

                  return (
                  <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
                    {/* Label Diskon */}
                    {isDiscounted && (
                      <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg">SALE</div>
                    )}

                    <div className="relative w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0">
                      <Image
                        src={item.image || '/assets/placeholder.png'}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h5 className="font-bold text-foreground text-sm leading-tight pr-4">
                        {item.name}
                      </h5>
                      <div className="flex gap-2 mt-1">
                        {item.selectedSize && (
                          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300">
                            Size: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300">
                            Warna: {item.selectedColor}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-xs font-bold text-foreground">
                          Qty: {item.quantity}
                        </span>
                        
                        <div className="text-right">
                          <span className="font-black text-blue-600 dark:text-blue-400 text-sm block">
                            {formatRupiah(itemFinalPrice)}
                          </span>
                          {isDiscounted && (
                            <span className="text-[10px] text-slate-400 line-through block">
                              {formatRupiah(itemOriginalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )})}
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
        
        {/* Footer Aksi */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
          {selectedOrder.status === "pending" || selectedOrder.status === "PENDING_PAYMENT" ? (
            <p className="text-sm text-amber-600 font-bold flex items-center gap-2">
              <Clock className="w-4 h-4" /> Menunggu pembayaran pelanggan.
            </p>
          ) : selectedOrder.status === "paid" || selectedOrder.status === "PAID" ? (
            <div className="flex items-center gap-3 w-full justify-end">
              <p className="text-sm text-slate-500 mr-auto hidden sm:block">
                Pesanan lunas. Segera siapkan pesanan.
              </p>
              <button
                onClick={() => onActionPrompt("packing")}
                disabled={isUpdatingStatus}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isUpdatingStatus ? "Memproses..." : <><Package className="w-4 h-4" /> Proses (Kemas)</>}
              </button>
            </div>
          ) : selectedOrder.status === "packing" || selectedOrder.status === "PROCESSING" ? (
            <div className="flex items-center gap-3 w-full justify-end">
              <p className="text-sm text-slate-500 mr-auto hidden sm:block">
                Pesanan sedang dikemas. Masukkan resi jika diserahkan ke kurir.
              </p>
              <button
                onClick={() => onActionPrompt("shipped")}
                disabled={isUpdatingStatus}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isUpdatingStatus ? "Memproses..." : <><Truck className="w-4 h-4" /> Kirim (Input Resi)</>}
              </button>
            </div>
          ) : selectedOrder.status === "shipped" || selectedOrder.status === "SHIPPED" ? (
            <div className="flex items-center gap-3 w-full justify-between">
               <p className="text-sm text-blue-600 font-bold flex items-center gap-2">
                <Truck className="w-4 h-4" /> Menunggu konfirmasi dari pelanggan.
              </p>
              <button
                onClick={() => onActionPrompt("completed")}
                disabled={isUpdatingStatus}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full font-bold transition-all text-sm shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isUpdatingStatus ? "Memproses..." : <><ShieldCheck className="w-4 h-4" /> Set Selesai Manual</>}
              </button>
            </div>
          ) : selectedOrder.status === "completed" || selectedOrder.status === "COMPLETED" ? (
            <p className="text-sm text-emerald-600 font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Pesanan telah Selesai.
            </p>
          ) : (
            <p className="text-sm font-bold text-foreground/50">
              Status: {getStatusBadge(selectedOrder.status)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}