"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, KeyRound, ArrowRight, ShieldCheck, ArrowLeft, User } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, user, checkAuth, isInitialized } = useAuthStore();

  const [isLoginMode, setIsLoginMode] = useState(true); // Toggle Login/Register
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitialized && user) {
      router.push(user.role === 'admin' ? '/admin' : '/');
    }
  }, [user, isInitialized, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      if (isLoginMode) {
        // PROSES LOGIN
        const result = login(formData.email, formData.password);
        if (result.success) {
          alert(result.message);
        } else {
          alert(result.message);
          setIsProcessing(false);
        }
      } else {
        // PROSES REGISTER (SYARAT UTS)
        const result = register(formData.name, formData.email, formData.password);
        if (result.success) {
          alert(result.message);
          setIsLoginMode(true); // Pindah ke form login setelah sukses daftar
          setFormData(prev => ({ ...prev, password: '' })); // Kosongkan password
        } else {
          alert(result.message); // Tampilkan pesan error (Misal: Password < 6, Email sudah ada)
        }
        setIsProcessing(false);
      }
    }, 800); // Simulasi loading network
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormData({ name: '', email: '', password: '' }); // Reset form
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
      
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Toko
      </Link>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 p-8 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Warhope<span className="text-blue-600">.</span></h1>
          <p className="text-sm text-slate-500">
            {isLoginMode ? "Masuk ke akun Anda untuk pengalaman berbelanja." : "Buat akun baru untuk mulai berbelanja."}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Input Nama (Hanya muncul saat mode Register) */}
          {!isLoginMode && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  name="name"
                  required={!isLoginMode}
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Budi Santoso" 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-900"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="email@contoh.com" 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Kata Sandi</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder={isLoginMode ? "••••••••" : "Minimal 6 karakter"} 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-900"
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
              <>{isLoginMode ? 'Masuk' : 'Daftar'} <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {isLoginMode ? "Belum punya akun? " : "Sudah punya akun? "}
          <button onClick={toggleMode} className="text-blue-600 font-bold hover:underline outline-none">
            {isLoginMode ? "Daftar sekarang" : "Masuk di sini"}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex justify-center items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Login Aman & Terenkripsi
          </p>
        </div>
      </div>
    </main>
  );
}