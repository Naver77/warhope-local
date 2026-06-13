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
    // Jangan lakukan auto-redirect ke beranda jika sedang dalam proses pendaftaran
    if (isInitialized && user && !isProcessing) {
      router.replace(user.role === 'admin' ? '/admin' : '/');
    }
  }, [user, isInitialized, router, isProcessing]);

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
            full_name: cleanName, 
          }
        }
      });

      if (authError) throw authError;

      // 2. Auto-login (Jalur Cepat: Kirim data lengkap agar tidak hit database lagi)
      if (authData.user) {
        login({ 
          id: authData.user.id,
          email: cleanEmail,
          name: cleanName,     // 🔥 Ini mengaktifkan fitur instan di authStore
          role: 'customer'     // 🔥 Ini juga
        });
      }
      
      addToast('Pendaftaran berhasil! Silakan lengkapi alamat pengiriman Anda.', 'success');
      
      // 3. Arahkan secara paksa dan instan
      router.replace('/profile');
      router.refresh();

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
    // Ditambahkan pt-28 (padding top) agar tidak menabrak navbar di atas, dan py-12 agar aman dari bawah
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pt-28 pb-12 relative">
      
      {/* Posisi tombol kembali disesuaikan agar turun mengikuti container utama */}
      <div className="w-full max-w-md lg:max-w-4xl mb-4 z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-foreground/50 hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Toko
        </Link>
      </div>

      {/* max-w-md untuk mobile, max-w-4xl untuk desktop agar form melebar */}
      <div className="w-full max-w-md lg:max-w-4xl bg-white dark:bg-slate-800/50 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 lg:p-12 animate-in zoom-in-95 duration-500 relative">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>

        <div className="text-center lg:text-left mb-8 relative z-10">
          <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Daftar Akun Baru</h1>
          <p className="text-sm text-foreground/60">Bergabunglah dengan Warhope dan temukan gaya terbaik Anda.</p>
        </div>
        
        <form onSubmit={handleRegister} className="relative z-10">
          {/* Wrapper Flex: Stack di mobile (flex-col), Berjejer di desktop (lg:flex-row) */}
          <div className="flex flex-col lg:flex-row lg:gap-12">
            
            {/* KOLOM KIRI: 3 Input Data */}
            <div className="flex-1 space-y-5">
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
            </div>

            {/* KOLOM KANAN: Button & Informasi */}
            {/* Ditambahkan divider/border kiri khusus untuk mode desktop agar layout lebih terstruktur */}
            <div className="flex-1 flex flex-col justify-center mt-8 lg:mt-0 lg:border-l lg:border-slate-100 dark:lg:border-slate-800 lg:pl-12">
              <button type="submit" disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2">
                {isProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <>Buat Akun <ArrowRight className="w-4 h-4" /></>}
              </button>

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
                  <ShieldCheck className="w-4 h-4 text-blue-500" /> Data Anda aman bersama kami
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>
    </main>
  );
}