"use client";

import { useEffect } from 'react';

export const usePreventNavigation = (onIntercept) => {
  useEffect(() => {
    // 1. Mencegah tombol Back / Gestur Swipe dengan menjebak riwayat
    window.history.pushState(null, document.title, window.location.href);

    const handlePopState = () => {
      // Pasang kembali jebakan agar user tidak benar-benar pindah
      window.history.pushState(null, document.title, window.location.href);
      
      // Beri sinyal ke komponen Layout untuk memunculkan Halaman Modal
      if (onIntercept) onIntercept();
    };

    // 2. Mencegah tombol Refresh (F5) / Tutup Tab
    const handleBeforeUnload = (event) => {
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