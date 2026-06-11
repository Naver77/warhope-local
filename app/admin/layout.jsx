"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

import { useAuthStore } from '../../store/authStore';
import Sidebar from './components/Sidebar';
import { usePreventNavigation } from '../../hooks/usePreventNavigation';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user, isInitialized, checkAuth } = useAuthStore();
  
  // STATE UNTUK MENGONTROL HALAMAN NOTIFIKASI RAKSASA
  const [showExitWarning, setShowExitWarning] = useState(false);

  // Menerima superadmin, admin_staff, dan admin (untuk kompatibilitas data lama)
  const hasAdminAccess = user && (
    user.role === 'superadmin' || 
    user.role === 'admin_staff' || 
    user.role === 'ADMIN' || 
    user.role === 'admin'
  );

  // Pasang Hook Keamanan. Jika user klik Back, showExitWarning menjadi TRUE
  usePreventNavigation(() => {
    setShowExitWarning(true);
  });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        router.replace('/auth/login');
      } else if (!hasAdminAccess) { // Ubah di sini
        router.replace('/');
      }
    }
  }, [isInitialized, user, hasAdminAccess, router]); // Sesuaikan dependency array

  // Fungsi jika user memaksa ingin keluar
  const handleForceLeave = () => {
    setShowExitWarning(false);
    window.history.go(-2); 
  };

  // 1. SKELETON SHELL: Tampil instan (0 detik) saat verifikasi berjalan
  if (!isInitialized) {
    return (
      <div className="fixed inset-0 z-100 bg-slate-50 dark:bg-[#0A0A0A] flex flex-col md:flex-row font-sans overflow-hidden pointer-events-none">
        {/* Kerangka Sidebar (Desktop) */}
        <div className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col p-6 animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg mb-10 w-3/4"></div>
          <div className="space-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-full"></div>
            ))}
          </div>
        </div>
        {/* Kerangka Area Utama */}
        <div className="flex-1 flex flex-col h-full overflow-hidden p-6 md:p-8 lg:p-10">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-64 mb-8 animate-pulse"></div>
          <div className="flex-1 bg-slate-200/50 dark:bg-slate-800/30 rounded-3xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  // 2. KOSONGKAN UI SAAT REDIRECT: Mencegah penyusup melihat UI Admin sesaat
  if (!isAdmin) {
    return null;
  }

  // 3. UI ADMIN ASLI TAMPIL
  return (
    <>
      <div className="fixed inset-0 z-100 bg-slate-50 dark:bg-[#0A0A0A] flex flex-col md:flex-row font-sans overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 pb-24 custom-scrollbar">
            {children}
          </main>
          <footer className="absolute bottom-0 w-full py-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-center shrink-0 z-10">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              &copy; {new Date().getFullYear()} Warhope Apparel. Internal Management System.
            </p>
          </footer>
        </div>
      </div>

      {/* HALAMAN NOTIFIKASI FOKUS (OVERLAY RAKSASA) */}
      {showExitWarning && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-8 sm:p-10 text-center animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <AlertTriangle className="w-12 h-12" />
            </div>
            
            <h2 className="text-3xl font-black text-foreground mb-4 tracking-tight">
              Tunggu Sebentar!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base mb-10 leading-relaxed">
              Anda mencoba meninggalkan halaman Admin Panel melalui navigasi browser. <br className="hidden sm:block" />
              <strong className="text-foreground">Apakah Anda yakin ingin keluar?</strong> Perubahan yang belum disimpan mungkin akan hilang.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button 
                onClick={() => setShowExitWarning(false)} 
                className="flex-1 py-4 px-6 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-lg shadow-blue-600/20 active:scale-95 text-lg"
              >
                Tetap di Sini
              </button>
              <button 
                onClick={handleForceLeave} 
                className="flex-1 py-4 px-6 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-500 transition-all active:scale-95 text-lg border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
              >
                Ya, Keluar
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}