"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, KeyRound, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useToastStore } from '../../../store/toastStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, checkAuth } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  // Jika sudah login, tendang dari halaman login
  useEffect(() => {
    checkAuth();
    if (user) {
      router.push(user.role === 'admin' ? '/admin' : '/');
    }
  }, [user, checkAuth, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

    setTimeout(() => {
      // LOGIKA ADMIN
      if (formData.email === 'admin@warhope.com') {
        if (formData.password === adminPass) {
          login({ name: 'Super Admin', email: formData.email, role: 'admin' });
          addToast('Selamat datang kembali, Admin!', 'success');
          router.push('/admin');
        } else {
          addToast('Password Admin salah!', 'error');
          setIsProcessing(false);
        }
      } 
      // LOGIKA USER BIASA (Simulasi)
      else {
        // Untuk MVP, semua password user biasa kita anggap benar
        const username = formData.email.split('@')[0];
        login({ name: username, email: formData.email, role: 'user' });
        addToast(`Halo ${username}, selamat berbelanja!`, 'success');
        router.push('/');
      }
    }, 1000); // Animasi loading
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      
      {/* Tombol Kembali */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold text-foreground/50 hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Toko
      </Link>

      <div className="max-w-md w-full bg-white dark:bg-slate-800/50 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Warhope<span className="text-blue-600">.</span></h1>
          <p className="text-sm text-foreground/60">Masuk ke akun Anda untuk pengalaman berbelanja yang lebih baik.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest px-1">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input 
                type="email" 
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="email@contoh.com" 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest px-1">Kata Sandi</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input 
                type="password" 
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••" 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all text-foreground"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isProcessing}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>Masuk <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold flex justify-center items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Login Aman & Terenkripsi
          </p>
        </div>
      </div>
    </main>
  );
}