"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { useAuthStore } from "../../store/authStore";
import Sidebar from "./components/Sidebar";
import { usePreventNavigation } from "../../hooks/usePreventNavigation";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user, isInitialized, checkAuth } = useAuthStore();

  const [showExitWarning, setShowExitWarning] = useState(false);

  const userRole = user?.role?.toLowerCase();
  const hasAdminAccess =
    user && ["superadmin", "admin_staff", "admin"].includes(userRole);

  // ✅ PERBAIKAN LOGIKA: Tunggu sampai token terbaca DAN data role milik user selesai diunduh
  const isAuthLoading = !isInitialized || (user && userRole === undefined);

  usePreventNavigation(() => {
    setShowExitWarning(true);
  });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // ✅ PERBAIKAN LOGIKA: Jangan lakukan pengecekan apa pun jika masih "loading"
    if (!isAuthLoading) {
      if (!user) {
        // Tidak ada sesi login sama sekali
        router.replace("/auth/login");
      } else if (!hasAdminAccess) {
        // Sudah login lengkap, tapi terbukti bukan admin
        router.replace("/");
      }
    }
  }, [isAuthLoading, user, hasAdminAccess, router]);

  // Fungsi jika user memaksa ingin keluar dari halaman admin ke beranda
  const handleForceLeave = () => {
    setShowExitWarning(false);
    
    // ✅ Aktifkan Kunci Rahasia sebelum pindah halaman!
    window.__ALLOW_LEAVE__ = true; 
    window.location.href = "/";
  };

  // ✅ Tampilkan SKELETON SHELL selama data belum utuh, jangan buru-buru menendang user
  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 z-100 bg-slate-50 dark:bg-[#0A0A0A] flex flex-col md:flex-row font-sans overflow-hidden pointer-events-none">
        <div className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col p-6 animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg mb-10 w-3/4"></div>
          <div className="space-y-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-full"
              ></div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col h-full overflow-hidden p-6 md:p-8 lg:p-10">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-64 mb-8 animate-pulse"></div>
          <div className="flex-1 bg-slate-200/50 dark:bg-slate-800/30 rounded-3xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Jika setelah ditunggu ternyata tetap bukan admin, tampilkan layar kosong (saat proses redirect terjadi)
  if (!hasAdminAccess) {
    return null;
  }

  // UI ADMIN ASLI TAMPIL
  return (
    <>
      {/* 3. UI ADMIN ASLI TAMPIL */}
      <div className="fixed inset-0 z-100 bg-slate-50 dark:bg-[#0A0A0A] flex flex-col md:flex-row font-sans overflow-hidden">
        
        {/* SIDEBAR */}
        <Sidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* ✅ HEADER YANG SUDAH DIJINAKKAN (Tanpa z-20 dan efek blur yang merusak tumpukan modal) */}
          <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-end items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-foreground">
                  {user?.email || "Pengguna"}
                </p>
                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  {userRole || "Admin"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-black shadow-sm">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>
            </div>
          </header>

          {/* ✅ MAIN TANPA relative z-0 */}
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
              Anda mencoba meninggalkan halaman Admin Panel melalui navigasi
              browser. <br className="hidden sm:block" />
              <strong className="text-foreground">
                Apakah Anda yakin ingin keluar?
              </strong>{" "}
              Perubahan yang belum disimpan mungkin akan hilang.
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
