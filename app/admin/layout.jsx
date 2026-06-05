"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar'; // Sesuaikan path

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user, isInitialized, checkAuth } = useAuthStore();

  // DERIVED STATE: Dihitung langsung saat render, tidak butuh useState
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'admin');
  const isAuthorized = isInitialized && isAdmin;

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // EFFECT UNTUK REDIRECT SAJA
  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        // Belum login
        router.push('/auth/login');
      } else if (!isAdmin) {
        // Sudah login tapi bukan admin
        router.push('/');
      }
    }
  }, [isInitialized, user, isAdmin, router]);

  // Tampilkan layar loading jika belum inisialisasi ATAU sedang proses redirect
  if (!isInitialized || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-sm text-slate-500 font-medium">Memverifikasi hak akses sistem...</p>
      </div>
    );
  }

  // Jika lolos verifikasi, render Admin
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}