"use client";

import React from 'react';
import { useToastStore } from '../store/toastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-100 flex flex-col gap-3 items-center pointer-events-none w-full max-w-sm px-4">
      {toasts.map((toast) => {
        // Menentukan warna & ikon berdasarkan tipe notifikasi
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-4 w-full animate-in fade-in slide-in-from-top-5 duration-300"
          >
            {/* Ikon */}
            <div className={`shrink-0 p-2 rounded-full ${isSuccess ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500' : isError ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500'}`}>
              {isSuccess && <CheckCircle2 className="w-5 h-5" />}
              {isError && <AlertCircle className="w-5 h-5" />}
              {!isSuccess && !isError && <Info className="w-5 h-5" />}
            </div>

            {/* Pesan Teks */}
            <p className="flex-1 text-sm font-medium text-foreground leading-snug">
              {toast.message}
            </p>

            {/* Tombol Tutup Manual */}
            <button 
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-foreground/40 hover:text-foreground transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}