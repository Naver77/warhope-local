"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useToastStore } from "../../../store/toastStore";
import { supabase } from "../../../lib/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Mencegah akses jika user membuka halaman ini secara manual tanpa token dari email
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        addToast("Sesi pemulihan tidak valid atau kadaluarsa.", "error");
        router.push("/auth/login");
      }
    };

    // KODE BARU (Sudah Diperbaiki)
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Mode pemulihan aktif
      }
    });

    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, addToast]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      addToast("Kata sandi minimal 6 karakter!", "error");
      return;
    }

    if (password !== confirmPassword) {
      addToast("Kata sandi dan konfirmasi tidak cocok!", "error");
      return;
    }

    setIsProcessing(true);

    try {
      // Melakukan update password ke Supabase
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      addToast("Kata sandi berhasil diperbarui! Silakan masuk.", "success");

      // Logout sesi recovery agar user harus login ulang secara normal
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Update Password Error:", error);
      addToast(
        "Gagal memperbarui kata sandi. Tautan mungkin kadaluarsa.",
        "error",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <div className="max-w-md w-full bg-white dark:bg-slate-800/50 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 animate-in zoom-in-95 duration-500 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">
            Sandi Baru
          </h1>
          <p className="text-sm text-foreground/60">
            Silakan buat kata sandi baru yang kuat untuk mengamankan akun Anda.
          </p>
        </div>

        <form
          onSubmit={handleUpdatePassword}
          className="space-y-5 relative z-10"
        >
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest px-1">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                type="password"
                required
                minLength="6"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest px-1">
              Konfirmasi Sandi Baru
            </label>
            <div className="relative">
              <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                type="password"
                required
                minLength="6"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              "Simpan Kata Sandi Baru"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center relative z-10">
          <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold flex justify-center items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-500" /> Transmisi Data
            Terenkripsi
          </p>
        </div>
      </div>
    </main>
  );
}
