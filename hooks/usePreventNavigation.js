"use client";

import { useEffect } from 'react';

export const usePreventNavigation = (onIntercept) => {
  useEffect(() => {
    // 1. Mencegah tombol Back / Gestur Swipe dengan menjebak riwayat
    window.history.pushState(null, document.title, window.location.href);

    const handlePopState = () => {
      // ✅ Cek Kunci Rahasia: Jika diizinkan keluar, biarkan lewat!
      if (window.__ALLOW_LEAVE__) return;

      // Pasang kembali jebakan agar user tidak benar-benar pindah
      window.history.pushState(null, document.title, window.location.href);
      
      // Beri sinyal ke komponen Layout untuk memunculkan Halaman Modal
      if (onIntercept) onIntercept();
    };

    // 2. Mencegah tombol Refresh (F5) / Tutup Tab
    const handleBeforeUnload = (event) => {
      // ✅ Cek Kunci Rahasia: Jika diizinkan keluar, matikan notifikasi bawaan browser!
      if (window.__ALLOW_LEAVE__) return;

      event.preventDefault();
      // Memicu modal dialog bawaan browser yang tidak bisa di-styling
      event.returnValue = ''; 
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [onIntercept]);
};