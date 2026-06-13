"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// ✅ ShieldCheck dihapus dari daftar import di bawah ini
import { KeyRound, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToastStore } from '../../../store/toastStore';
import { supabase } from '../../../lib/supabase';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      addToast('Kata sandi minimal 6 karakter!', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      // Supabase secara otomatis mengenali token dari URL setelah user klik link di email
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      addToast('Kata sandi berhasil diubah! Silakan login.', 'success');
      router.push('/auth/login');
    } catch (error) {
      console.error("Update Password Error:", error);
      addToast('Gagal memperbarui kata sandi. Tautan mungkin kedaluwarsa.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800/50 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-foreground mb-2">Atur Kata Sandi Baru</h1>
          <p className="text-sm text-foreground/60">Masukkan kata sandi baru untuk akun Anda.</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input 
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi baru"
              className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none transition-all text-foreground"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/80"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button type="submit" disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2">
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Perbarui Sandi <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </main>
  );
}