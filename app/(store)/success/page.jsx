"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../../store/cartStore';

export default function SuccessPage() {
  const { clearCart } = useCartStore();

  // Memastikan keranjang benar-benar kosong saat masuk halaman ini
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <main className="pt-32 pb-20 px-4 md:px-8 max-w-3xl mx-auto min-h-[80vh] flex flex-col items-center justify-center text-center bg-background">
      
      <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-8">
        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-500" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
        Terima Kasih!
      </h1>
      
      <p className="text-lg text-foreground/70 mb-2">
        Pesanan Anda telah kami terima dan sedang menunggu proses pembayaran.
      </p>
      
      <p className="text-sm text-foreground/50 mb-12 max-w-lg">
        Silakan selesaikan pembayaran melalui instruksi yang telah diberikan. 
        Kami akan memproses pesanan Anda segera setelah pembayaran dikonfirmasi.
      </p>
      
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-sm mb-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <ShoppingBag className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          <h2 className="text-xl font-bold text-foreground">Apa Selanjutnya?</h2>
          <ul className="text-sm text-left text-foreground/70 space-y-3 mt-2 w-full px-4">
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">1.</span>
              Selesaikan pembayaran sesuai nominal tagihan.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">2.</span>
              Sistem akan otomatis memverifikasi pembayaran Anda (biasanya 5-10 menit).
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">3.</span>
              Admin Warhope akan segera memproses dan mengirimkan pesanan Anda.
            </li>
          </ul>
        </div>
      </div>
      
      <Link 
        href="/" 
        className="group flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-full font-bold hover:scale-105 transition-all"
      >
        Lanjut Berbelanja 
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
      
    </main>
  );
}