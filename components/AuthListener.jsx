// components/AuthListener.jsx
"use client";

import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function AuthListener() {
  const { login, logout } = useAuthStore();

  useEffect(() => {
    // Pantau setiap perubahan sesi dari Supabase (Login/Logout/Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        // Ambil data profil terbaru dari public.users untuk mendapatkan Role
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile && !error) {
          login(profile); // Sinkronkan ke Zustand
        }
      } else if (event === 'SIGNED_OUT') {
        logout(); // Bersihkan Zustand jika user logout dari Supabase
      }
    });

    return () => {
      subscription.unsubscribe(); // Cleanup memori saat komponen dilepas
    };
  }, [login, logout]);

  // Komponen ini tidak memiliki UI (Renderless Component)
  return null; 
}