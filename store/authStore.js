import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUserProfile } from '../lib/api';

const ADMIN_TIMEOUT = 2 * 24 * 60 * 60 * 1000;
const USER_TIMEOUT = 3 * 24 * 60 * 60 * 1000;

// TAMBAHAN PROFESIONAL: Variabel global untuk menampung proses checkAuth yang sedang berjalan
let authPromise = null;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      lastActive: null,
      isInitialized: false,

      // UBAH FUNGSI INI DI store/authStore.js
      login: async (authUser) => {
        // Optimasi: Jika data yang dikirim sudah lengkap (berisi role/name dari halaman login), 
        // langsung simpan ke state TANPA nembak database lagi.
        if (authUser.role || authUser.name) {
          set({ user: authUser, lastActive: Date.now(), isInitialized: true });
          return;
        }

        // Fallback: Jika hanya data user mentah dari Supabase Auth
        const userProfile = await getUserProfile(authUser.id);
        const fullUserData = userProfile ? { ...authUser, ...userProfile } : authUser;
        set({ user: fullUserData, lastActive: Date.now(), isInitialized: true });
      },

      updateUserProfile: (updatedData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updatedData }, lastActive: Date.now() });
        }
      },

      logout: () => {
        set({ user: null, lastActive: null, isInitialized: true });
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('warhope_cart');
          window.localStorage.removeItem('warhope_wishlist');
        }
      },

      checkAuth: async () => {
        // CEGAH TABRAKAN: Jika checkAuth sedang diproses, antre di sini
        if (authPromise) {
          return await authPromise;
        }

        // Mulai proses baru dan simpan di variabel global
        authPromise = (async () => {
          const { user, lastActive } = get();
          
          if (!user) {
            set({ isInitialized: true });
            return false;
          }

          const now = Date.now();
          const timeoutLimit = user.role === 'admin' ? ADMIN_TIMEOUT : USER_TIMEOUT;

          if (now - lastActive > timeoutLimit) {
            get().logout(); 
            console.log("🔒 Sesi telah berakhir karena tidak ada aktivitas.");
            return false; 
          }

          if (user.id) {
            const freshProfile = await getUserProfile(user.id);
            if (freshProfile) {
              set({ user: { ...user, ...freshProfile }, lastActive: now, isInitialized: true });
              return true;
            }
          }

          set({ lastActive: now, isInitialized: true });
          return true;
        })();

        // Tunggu proses selesai, lalu kosongkan kembali antrean
        const result = await authPromise;
        authPromise = null; 
        return result;
      }
    }),
    {
      name: 'warhope_user', 
    }
  )
);