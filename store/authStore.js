import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// KONFIGURASI KEDALUWARSA SESI (Dalam Milidetik)
const ADMIN_TIMEOUT = 2 * 24 * 60 * 60 * 1000; // 2 Hari
const USER_TIMEOUT = 3 * 24 * 60 * 60 * 1000; // 3 Hari

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      lastActive: null,
      isInitialized: false,

      // Fungsi Login
      login: (userData) => {
        set({ 
          user: userData, 
          lastActive: Date.now(), 
          isInitialized: true 
        });
      },

      // Fungsi Logout (Pembersihan Data)
      logout: () => {
        set({ 
          user: null, 
          lastActive: null, 
          isInitialized: true 
        });

        // Hapus paksa memori Keranjang dan Wishlist di Local Storage browser
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('warhope_cart');
          window.localStorage.removeItem('warhope_wishlist');
        }
      },

      // Fungsi Cek Sesi (Sliding Expiration)
      checkAuth: () => {
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

        set({ lastActive: now, isInitialized: true });
        return true;
      }
    }),
    {
      name: 'warhope_user', 
    }
  )
);