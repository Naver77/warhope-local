"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, ShieldCheck, Send } from 'lucide-react';
import { useToastStore } from '../../../store/toastStore';
import { supabase } from '../../../lib/supabase'; // Pastikan path ini benar

export default function ForgotPasswordPage() {
  const addToast = useToastStore((state) => state.addToast);
  
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!email.includes('@')) {
      addToast('Format email tidak valid!', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      // Memanggil fungsi reset Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Mengarahkan user ke halaman update password setelah klik link di email
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      setIsSent(true);
      addToast('Tautan pemulihan kata sandi telah dikirim!', 'success');
    } catch (error) {
      console.error("Reset Password Error:", error);
      addToast(error.message === 'User not found' ? 'Email tidak terdaftar.' : 'Terjadi kesalahan. Coba lagi nanti.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    // ... (Sisa UI sama persis dengan kode Anda sebelumnya)
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <Link href="/auth/login" className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold text-foreground/50 hover:text-foreground transition-colors z-10">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Login
      </Link>

      <div className="max-w-md w-full bg-white dark:bg-slate-800/50 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 animate-in zoom-in-95 duration-500 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Lupa Sandi?</h1>
          <p className="text-sm text-foreground/60">
            Jangan khawatir! Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi.
          </p>
        </div>
        
        {!isSent ? (
          <form onSubmit={handleResetPassword} className="space-y-5 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest px-1">Alamat Email Terdaftar</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input 
                  type="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com" 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all text-foreground"
                />
              </div>
            </div>

            <button type="submit" disabled={isProcessing} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2">
              {isProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <>Kirim Tautan Reset <Send className="w-4 h-4" /></>}
            </button>
          </form>
        ) : (
          <div className="text-center relative z-10 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 p-6 rounded-2xl">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Cek Kotak Masuk Anda</h3>
            <p className="text-sm text-foreground/70 mb-6">Kami telah mengirimkan instruksi pemulihan ke <span className="font-semibold">{email}</span></p>
            <button onClick={() => setIsSent(false)} className="text-xs font-bold text-blue-600 hover:underline">
              Gunakan email lain
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center relative z-10">
          <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold flex justify-center items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-500" /> Transmisi Data Terenkripsi
          </p>
        </div>
      </div>
    </main>
  );
}