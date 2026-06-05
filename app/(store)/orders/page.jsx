"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Truck, CheckCircle, Clock, Copy, ExternalLink, Star, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useToastStore } from '../../../store/toastStore';
import { getUserOrders, markOrderAsCompleted, submitReview } from '../../../lib/api';
import { formatRupiah, formatDate } from '../../admin/utils';

export default function UserOrdersPage() {
  const router = useRouter();
  const { user, isInitialized, checkAuth } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [reviewModal, setReviewModal] = useState({ isOpen: false, orderId: null, product: null });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await getUserOrders(user.id);
    setOrders(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        router.push('/auth/login');
      } else {
        fetchOrders();
      }
    }
  }, [isInitialized, user, router, fetchOrders]);

  const handleCopyResi = (resi) => {
    navigator.clipboard.writeText(resi);
    addToast('Nomor resi disalin ke clipboard!', 'success');
  };

  const handleCompleteOrder = async (orderId) => {
    if (!confirm('Apakah Anda yakin pesanan sudah diterima dengan baik dan sesuai?')) return;
    
    setIsProcessing(true);
    try {
      await markOrderAsCompleted(orderId);
      addToast('Pesanan selesai! Terima kasih telah berbelanja.', 'success');
      fetchOrders();
    } catch (err) {
      console.error(err);
      addToast('Gagal menyelesaikan pesanan.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) { addToast('Tulis ulasan Anda terlebih dahulu.', 'error'); return; }

    setIsProcessing(true);
    try {
      await submitReview({
        product_id: reviewModal.product.id,
        order_id: reviewModal.orderId,
        user_id: user.id,
        user_name: user.name || user.email.split('@')[0],
        rating: rating,
        comment: comment.trim()
      });
      addToast('Ulasan berhasil dikirim! Terima kasih.', 'success');
      setReviewModal({ isOpen: false, orderId: null, product: null });
      setRating(5);
      setComment("");
    } catch (err) {
      console.error(err);
      addToast('Gagal mengirim ulasan.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseItems = (items) => {
    if (!items) return [];
    try { return typeof items === 'string' ? JSON.parse(items) : items; } 
    catch { return []; }
  };

  const getStatusStep = (status) => {
    if (status === 'PENDING_PAYMENT' || status === 'PENDING') return 1;
    if (status === 'PAID' || status === 'PROCESSING') return 2;
    if (status === 'SHIPPED') return 3;
    if (status === 'COMPLETED') return 4;
    return 0;
  };

  if (!isInitialized || !user) return <div className="min-h-screen pt-32 pb-20 bg-background"></div>;

  return (
    <main className="pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto min-h-screen bg-background animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Pesanan Saya</h1>
        <p className="text-slate-500 mt-2">Lacak pengiriman dan riwayat belanja Anda di Warhope.</p>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center shadow-sm">
          <ShoppingBag className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-6" />
          <h2 className="text-xl font-bold text-foreground mb-2">Belum ada pesanan</h2>
          <p className="text-slate-500 mb-8 max-w-sm">Anda belum melakukan transaksi apa pun. Yuk, lihat koleksi terbaru kami!</p>
          <Link href="/katalog" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95">Mulai Belanja</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const step = getStatusStep(order.status);
            const items = parseItems(order.items);
            const isCanceled = order.status === 'CANCELED' || order.status === 'EXPIRED';

            return (
              <div key={order.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{formatDate(order.created_at)}</p>
                    <p className="font-bold text-foreground text-lg flex items-center gap-2">
                      {order.invoice_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium mb-1">Total Belanja</p>
                    <p className="font-black text-blue-600 dark:text-blue-400 text-lg">{formatRupiah(order.total_amount)}</p>
                  </div>
                </div>

                <div className="p-6">
                  {!isCanceled && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2 relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full z-0"></div>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-1000" style={{ width: `${(step - 1) * 33.33}%` }}></div>
                        
                        <div className={`relative z-10 flex flex-col items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-slate-300 dark:text-slate-600'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}><Clock className="w-4 h-4" /></div>
                          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Dibayar</span>
                        </div>
                        
                        <div className={`relative z-10 flex flex-col items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-slate-300 dark:text-slate-600'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}><Package className="w-4 h-4" /></div>
                          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Dikemas</span>
                        </div>
                        
                        <div className={`relative z-10 flex flex-col items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-slate-300 dark:text-slate-600'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}><Truck className="w-4 h-4" /></div>
                          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Dikirim</span>
                        </div>
                        
                        <div className={`relative z-10 flex flex-col items-center gap-2 ${step >= 4 ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${step >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}><CheckCircle className="w-4 h-4" /></div>
                          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Selesai</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isCanceled && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-2">
                      <X className="w-5 h-5" /> Pesanan ini Dibatalkan atau Kedaluwarsa.
                    </div>
                  )}

                  {order.tracking_number && step === 3 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70 font-bold uppercase tracking-widest mb-1">Nomor Resi Pengiriman</p>
                        <p className="text-xl font-black text-blue-700 dark:text-blue-400 tracking-wider flex items-center gap-2">
                          {order.tracking_number}
                          <button onClick={() => handleCopyResi(order.tracking_number)} className="p-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 transition-colors" title="Salin Resi"><Copy className="w-4 h-4" /></button>
                        </p>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Lacak resi di web kurir terkait.</p>
                      </div>
                      <button 
                        onClick={() => handleCompleteOrder(order.id)}
                        disabled={isProcessing}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" /> Pesanan Diterima
                      </button>
                    </div>
                  )}

                  <div className="space-y-4">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <h4 className="font-bold text-foreground text-sm">{item.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">Size: {item.selectedSize} <span className="mx-2">•</span> Qty: {item.quantity}</p>
                        </div>
                        
                        {step === 4 && (
                          <div className="flex items-center sm:items-end">
                            <button 
                              onClick={() => setReviewModal({ isOpen: true, orderId: order.id, product: item })}
                              className="w-full sm:w-auto px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                            >
                              <Star className="w-4 h-4" /> Beri Ulasan
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-140 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-foreground mb-1">Nilai Produk Ini</h3>
            <p className="text-xs text-slate-500 mb-6">Bagaimana kualitas {reviewModal.product?.name}?</p>
            
            <form onSubmit={handleSubmitReview}>
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} type="button" onClick={() => setRating(star)}
                    className={`p-2 transition-transform hover:scale-110 ${star <= rating ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                  >
                    <Star className="w-10 h-10 fill-current" />
                  </button>
                ))}
              </div>

              <textarea 
                required rows={4} value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Ceritakan pengalaman Anda memakai produk ini..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground resize-none mb-6"
              ></textarea>

              <div className="flex gap-3">
                <button type="button" onClick={() => setReviewModal({ isOpen: false, orderId: null, product: null })} className="flex-1 py-3 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200">Batal</button>
                <button type="submit" disabled={isProcessing} className="flex-1 py-3 rounded-full font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
                  {isProcessing ? 'Menyimpan...' : 'Kirim Ulasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}