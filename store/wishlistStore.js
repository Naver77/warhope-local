import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      wishlist: [],
      
      // MENGHAPUS FUNGSI SINKRONISASI DATABASE (SYARAT UTS)
      // Kita tidak lagi butuh fungsi ini karena persist otomatis sinkron dari LocalStorage
      
      // MENAMBAH/MENGHAPUS WISHLIST (HANYA LOCAL STORAGE)
      toggleWishlist: (product) => {
        const wishlist = get().wishlist;
        const exists = wishlist.find(item => item.id === product.id);
        
        if (exists) {
          // Hapus dari UI & LocalStorage
          set({ wishlist: wishlist.filter(item => item.id !== product.id) });
        } else {
          // Tambah ke UI & LocalStorage
          set({ wishlist: [...wishlist, product] });
        }
      },

      // Mengecek apakah produk ada di wishlist
      isInWishlist: (id) => {
        return get().wishlist.some(item => item.id === id);
      },

      // Kosongkan wishlist saat Logout
      clearWishlist: () => set({ wishlist: [] }),
    }),
    {
      name: 'warhope_wishlist', // Disimpan di lokal (Syarat UTS Mutlak)
    }
  )
);