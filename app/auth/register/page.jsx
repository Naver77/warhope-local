"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, KeyRound, User, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useToastStore } from '../../../store/toastStore';
import { supabase } from '../../../lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const { login, user, checkAuth, isInitialized } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitialized && user) {
      router.replace(user.role === 'admin' ? '/admin' : '/');
    }
  }, [user, isInitialized, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim().toLowerCase();
    
    if (cleanName.length < 3) {
      addToast('Nama lengkap minimal 3 karakter!', 'error');
      return;
    }
    if (!cleanEmail.includes('@')) {
      addToast('Format email tidak valid!', 'error');
      return;
    }
    if (formData.password.length < 6) {
      addToast('Kata sandi minimal 6 karakter!', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Eksekusi Registrasi Asli ke Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password,
        options: {
          data: {
            full_name: cleanName, // Ini akan ditangkap otomatis oleh Database Trigger kita
          }
        }
      });

      if (authError) throw authError;

      // 2. Auto-login jika Supabase langsung mengembalikan sesi (jika konfirmasi email dimatikan)
      if (authData.user) {
        await login({ 
          id: authData.user.id,
          email: cleanEmail, 
        });
      }
      
      addToast('Pendaftaran berhasil! Selamat bergabung di Warhope.', 'success');
      window.location.href = '/'; 

    } catch (error) {
      console.error("Register Error:", error);
      addToast(error.message === 'User already registered' ? 'Email ini sudah terdaftar. Silakan login.' : 'Gagal melakukan pendaftaran. Coba lagi nanti.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold text-foreground/50 hover:text-foreground transition-colors z-10">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Toko
      </Link>

      <div className="max-w-md w-full bg-white dark:bg-slate-800/50 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 animate-in zoom-in-95 duration-500 relative">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Daftar Akun Baru</h1>
          <p className="text-sm text-foreground/60">Bergabunglah dengan Warhope dan temukan gaya terbaik Anda.</p>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-5 relative z-10">
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest px-1">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input 
                type="text" name="name" required
                value={formData.name} onChange={handleInputChange}
                placeholder="Budi Santoso" 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest px-1">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input 
                type="email" name="email" required
                value={formData.email} onChange={handleInputChange}
                placeholder="nama@email.com" 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest px-1">Kata Sandi</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input 
                type="password" name="password" required minLength="6"
                value={formData.password} onChange={handleInputChange}
                placeholder="••••••••" 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all text-foreground"
              />
            </div>
          </div>

          <button type="submit" disabled={isProcessing} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2">
            {isProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <>Buat Akun <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <p className="text-sm text-foreground/60">
            Sudah punya akun?{' '}
            <Link href="/auth/login" className="text-blue-600 font-bold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center relative z-10">
          <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold flex justify-center items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-500" /> Data Anda aman bersama kami
          </p>
        </div>
      </div>
    </main>
  );
}