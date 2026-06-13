"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from "next/navigation";
import Link from 'next/link';
import { Mail, KeyRound, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useToastStore } from '../../../store/toastStore';
import { useCartStore } from '../../../store/cartStore'; 
import { supabase } from '../../../lib/supabase'; 

// 1. Ini adalah komponen internal yang melakukan logika Search Params
function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const redirectUrl = searchParams.get("redirect") || "/";
  
  const { login, user, checkAuth, isInitialized } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitialized && user && !isProcessing) {
      const isAdmin = ['superadmin', 'admin_staff', 'admin'].includes(user.role?.toLowerCase());
      const defaultPath = isAdmin ? '/admin' : '/';
      router.replace(redirectUrl !== "/" ? redirectUrl : defaultPath);
    }
  }, [user, isInitialized, router, redirectUrl, isProcessing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = formData.password.trim();

    if (!cleanEmail.includes('@') || cleanPassword.length < 6) {
      addToast('Email atau kata sandi tidak valid!', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authError) throw authError;

      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profileData) {
        throw new Error("Profil pengguna tidak ditemukan di database.");
      }

      await login(profileData);

      const userRole = profileData.role?.toLowerCase() || 'customer';
      const userName = profileData.name || cleanEmail.split('@')[0];
      const isAdminLevel = ['superadmin', 'admin_staff', 'admin'].includes(userRole);

      addToast(isAdminLevel ? `Autentikasi ${userRole.replace('_', ' ')} berhasil.` : `Selamat datang kembali, ${userName}!`, 'success');
      
      const targetPath = redirectUrl !== "/" ? redirectUrl : (isAdminLevel ? '/admin' : '/');

      if (!isAdminLevel) {
        const { syncCartFromDB } = useCartStore.getState();
        syncCartFromDB(authData.user.id); 
      }
      
      router.replace(targetPath);
      router.refresh(); 

    } catch (error) {
      console.error("Login Error:", error);
      addToast(error.message === 'Invalid login credentials' ? 'Email atau kata sandi salah.' : error.message, 'error');
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
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pt-28 pb-12 relative">
      <div className="w-full max-w-md lg:max-w-4xl mb-4 z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-foreground/50 hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Toko
        </Link>
      </div>

      <div className="w-full max-w-md lg:max-w-4xl bg-white dark:bg-slate-800/50 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 lg:p-12 animate-in zoom-in-95 duration-500 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>

        <div className="text-center lg:text-left mb-8 relative z-10">
          <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Warhope<span className="text-blue-600">.</span></h1>
          <p className="text-sm text-foreground/60">Masuk ke akun Anda untuk pengalaman berbelanja yang lebih personal.</p>
        </div>
        
        <form onSubmit={handleLogin} className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:gap-12">
            <div className="flex-1 space-y-5">
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

            <div className="flex-1 flex flex-col justify-center mt-8 lg:mt-0 lg:border-l lg:border-slate-100 dark:lg:border-slate-800 lg:pl-12">
              <button type="submit" disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2">
                {isProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <>Masuk Sekarang <ArrowRight className="w-4 h-4" /></>}
              </button>

              <div className="mt-8 text-center relative z-10">
                <p className="text-sm text-foreground/60">
                  Belum punya akun?{' '}
                  <Link href={`/auth/register?redirect=${encodeURIComponent(redirectUrl)}`} className="text-blue-600 font-bold hover:underline">
                    Daftar di sini
                  </Link>
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center relative z-10">
                <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold flex justify-center items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-blue-500" /> Transmisi Data Terenkripsi
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

// 2. Ini adalah fungsi utama yang di-export dan membungkus LoginContent dengan Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}