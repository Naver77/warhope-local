import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      wishlist: [],
      
      // Menambah atau menghapus dari wishlist (Toggle)
      toggleWishlist: (product) => {
        const wishlist = get().wishlist;
        const exists = wishlist.find(item => item.id === product.id);
        
        if (exists) {
          // Jika sudah ada, hapus
          set({ wishlist: wishlist.filter(item => item.id !== product.id) });
        } else {
          // Jika belum ada, tambahkan
          set({ wishlist: [...wishlist, product] });
        }
      },

      // Mengecek apakah produk ada di wishlist
      isInWishlist: (id) => {
        return get().wishlist.some(item => item.id === id);
      },

      // Kosongkan wishlist
      clearWishlist: () => set({ wishlist: [] }),
    }),
    {
      name: 'warhope_wishlist', // Disimpan di local storage
    }
  )
);