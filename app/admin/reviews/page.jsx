"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { Star, MessageSquare, Trash2, Search, XCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useToastStore } from '../../../store/toastStore';
import { useAuthStore } from '../../../store/authStore';
import { formatDate } from '../utils';

// OPTIMASI: Batasi kolom yang diambil untuk mempercepat performa kueri
const fetchAllReviews = async () => {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, user_name, rating, comment, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export default function AdminReviewsPage() {
  const addToast = useToastStore((state) => state.addToast);
  
  // ✅ 1. Panggil sistem autentikasi Anda
  const { user, isInitialized } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ 2. Buat kunci gembok untuk SWR
  const userRole = user?.role?.toLowerCase() || "";
  const hasAdminAccess = isInitialized && user && ["superadmin", "admin_staff", "admin"].includes(userRole);

  const { data: reviews = [], isLoading, error, mutate } = useSWR(
    // ✅ 3. SWR HANYA akan memuat data jika user sudah terbukti sebagai admin
    hasAdminAccess ? "admin-all-reviews-list" : null,
    fetchAllReviews,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false
    }
  );

  const filteredReviews = reviews.filter((review) =>
    review.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.comment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";

  const handleDeleteReview = async (id) => {
    const isConfirmed = window.confirm("Apakah Anda yakin ingin menghapus ulasan ini?");
    if (!isConfirmed) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;

      addToast("Ulasan berhasil dihapus.", "success");
      mutate(reviews.filter(r => r.id !== id), { revalidate: false });
    } catch (error) {
      console.error(error);
      addToast("Gagal menghapus ulasan.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ 4. Tahan render UI sampai Zustand selesai memuat memori (Pencegahan UI berkedip)
  if (!isInitialized) return null;

  // TAMPILKAN UI ERROR JIKA DATABASE BERMASALAH
  if (error) {
    return (
      <div className="min-h-64 flex flex-col items-center justify-center text-center p-6 bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-100 dark:border-red-900/30">
        <XCircle className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-foreground">Gagal Memuat Ulasan</h3>
        <p className="text-sm text-slate-500 max-w-md mt-1">{error.message || "Periksa kembali koneksi database atau kebijakan RLS tabel reviews Anda."}</p>
        <button onClick={() => mutate()} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Coba Lagi</button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 pb-16">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Ulasan Pelanggan</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pantau dan kelola ulasan dari pembeli produk Anda.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center gap-6">
          <div className="text-center shrink-0">
            <h3 className="text-5xl font-black text-foreground">{averageRating}</h3>
            <div className="flex justify-center text-amber-400 mt-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} className={`w-4 h-4 ${star <= Math.round(parseFloat(averageRating)) ? 'fill-current' : 'text-slate-200 dark:text-slate-700'}`} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Rating Rata-Rata</p>
            <p className="text-sm text-foreground mt-1">Berdasarkan kalkulasi dari seluruh produk Anda.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center gap-6">
           <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center rounded-2xl shrink-0">
             <MessageSquare className="w-8 h-8" />
           </div>
           <div>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Ulasan</p>
             <h3 className="text-3xl font-black text-foreground">{reviews.length} <span className="text-sm font-medium text-slate-400">Masuk</span></h3>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-foreground">Daftar Ulasan</h3>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau komentar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
            />
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="animate-pulse font-medium">Memuat daftar ulasan...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-bold text-foreground">Belum Ada Ulasan</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1">Ulasan pelanggan akan muncul di sini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReviews.map((review) => (
                <div key={review.id} className="p-5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl group hover:shadow-md transition-shadow relative">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-foreground">{review.user_name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-0.5">
                        {formatDate(review.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-1 text-amber-400">
                      {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed mb-4">{review.comment}</p>
                  
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDeleteReview(review.id)}
                      disabled={isDeleting}
                      className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                      title="Hapus Ulasan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}