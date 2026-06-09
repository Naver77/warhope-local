import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUserProfile } from '../lib/api'; // Import fungsi fetch profil

// KONFIGURASI KEDALUWARSA SESI (Dalam Milidetik)
const ADMIN_TIMEOUT = 2 * 24 * 60 * 60 * 1000; // 2 Hari
const USER_TIMEOUT = 3 * 24 * 60 * 60 * 1000; // 3 Hari

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      lastActive: null,
      isInitialized: false,

      // Fungsi Login (Diperbarui untuk menarik data lengkap dari DB)
      login: async (authUser) => {
        // Ambil data detail profil dari tabel public.users berdasarkan authUser.id
        const userProfile = await getUserProfile(authUser.id);
        
        // Gabungkan data dasar dari auth dengan data detail dari tabel users
        const fullUserData = userProfile ? { ...authUser, ...userProfile } : authUser;

        set({ 
          user: fullUserData, 
          lastActive: Date.now(), 
          isInitialized: true 
        });
      },

      // Fungsi Update Profil Khusus (Digunakan setelah edit profil di UI)
      updateUserProfile: (updatedData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updatedData },
            lastActive: Date.now()
          });
        }
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
      checkAuth: async () => {
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

        // Opsional: Sinkronisasi ulang profil setiap kali app dimuat (refresh)
        // Ini memastikan jika admin/user edit data di DB, memori lokal HP terupdate.
        if (user.id) {
            const freshProfile = await getUserProfile(user.id);
            if(freshProfile) {
                set({ user: { ...user, ...freshProfile }, lastActive: now, isInitialized: true });
                return true;
            }
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