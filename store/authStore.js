import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const ADMIN_TIMEOUT = 2 * 24 * 60 * 60 * 1000;
const USER_TIMEOUT = 3 * 24 * 60 * 60 * 1000;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,         // Data user yang sedang login
      users: [],          // SYARAT UTS: Array untuk menyimpan semua user yang register
      lastActive: null,
      isInitialized: false,

      // SYARAT UTS: Fungsi Register dengan Validasi
      register: (name, email, password) => {
        const { users } = get();
        
        // Validasi 1: Password minimal 6 karakter
        if (password.length < 6) {
          return { success: false, message: "Password minimal 6 karakter!" };
        }

        // Validasi 2: Email harus unik
        const isEmailExist = users.find(u => u.email === email);
        if (isEmailExist) {
          return { success: false, message: "Email sudah terdaftar!" };
        }

        // Simpan user baru ke database lokal (array users)
        const newUser = { name, email, password, role: 'user' };
        set({ users: [...users, newUser] });
        return { success: true, message: "Registrasi berhasil! Silakan login." };
      },

      // Fungsi Login (Mengecek ke database lokal)
      login: (email, password) => {
        // Bypass khusus Admin
        if (email === 'admin@warhope.com' && password === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123')) {
          set({ 
            user: { name: 'Super Admin', email: email, role: 'admin' }, 
            lastActive: Date.now(), 
            isInitialized: true 
          });
          return { success: true, message: "Selamat datang, Admin!" };
        }

        // Cek user biasa dari daftar 'users' di LocalStorage
        const { users } = get();
        const foundUser = users.find(u => u.email === email && u.password === password);
        
        if (foundUser) {
          set({ 
            // Jangan simpan password ke state session aktif
            user: { name: foundUser.name, email: foundUser.email, role: foundUser.role }, 
            lastActive: Date.now(), 
            isInitialized: true 
          });
          return { success: true, message: `Halo ${foundUser.name}, selamat datang!` };
        }

        return { success: false, message: "Email atau Password salah!" };
      },

      // Fungsi Logout
      logout: () => {
        set({ user: null, lastActive: null, isInitialized: true });
      },

      // Fungsi Cek Sesi
      checkAuth: () => {
        const { user, lastActive } = get();
        if (!user) {
          set({ isInitialized: true });
          return false;
        }

        const now = Date.now();
        const timeoutLimit = user.role === 'admin' ? ADMIN_TIMEOUT : USER_TIMEOUT;

        if (now - lastActive > timeoutLimit) {
          set({ user: null, lastActive: null, isInitialized: true });
          console.log("🔒 Sesi telah berakhir.");
          return false; 
        }

        set({ lastActive: now, isInitialized: true });
        return true;
      }
    }),
    {
      name: 'warhope_auth', // Disimpan di LocalStorage
    }
  )
);