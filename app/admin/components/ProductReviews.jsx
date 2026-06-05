"use client";

import React, { useEffect, useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { getProductReviews } from '../../../lib/api';

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      const data = await getProductReviews(productId);
      setReviews(data);
      setIsLoading(false);
    };
    if (productId) fetchReviews();
  }, [productId]);

  if (isLoading) {
    return <div className="py-8 text-center text-slate-500 animate-pulse">Memuat ulasan pelanggan...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
        <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
        <h3 className="text-lg font-bold text-foreground">Belum ada ulasan</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">Jadilah yang pertama memiliki produk ini dan bagikan pengalaman Anda.</p>
      </div>
    );
  }

  const averageRating = (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="mt-16 pt-16 border-t border-slate-200 dark:border-slate-800">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
        <div className="text-center md:text-left shrink-0">
          <h2 className="text-2xl font-black text-foreground mb-4">Ulasan Pelanggan</h2>
          <div className="flex items-center justify-center md:justify-start gap-4">
            <h3 className="text-6xl font-black text-foreground">{averageRating}</h3>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'fill-current' : 'text-slate-200 dark:text-slate-700'}`} />
                ))}
              </div>
              <p className="text-sm font-bold text-slate-500">Dari {reviews.length} ulasan</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((review) => (
          <div key={review.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-bold text-foreground">{review.user_name}</p>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">
                  {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-1 text-amber-400">
                {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}