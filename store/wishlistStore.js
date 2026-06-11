import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      wishlist: [],
      
      // Ubah userEmail menjadi userId
      syncWishlistFromDB: async (userId, allProducts) => {
        if (!userId || !allProducts || allProducts.length === 0) return;
        
        try {
          const { data, error } = await supabase
            .from('wishlists')
            .select('product_id')
            .eq('user_id', userId); // Gunakan user_id
            
          if (!error && data) {
            const savedIds = data.map(d => d.product_id);
            const syncedWishlist = allProducts.filter(p => savedIds.includes(p.id));
            set({ wishlist: syncedWishlist });
          }
        } catch (err) {
          console.error("Gagal sinkronisasi wishlist:", err);
        }
      },

      toggleWishlist: async (product, userId) => {
        const wishlist = get().wishlist;
        const exists = wishlist.find(item => item.id === product.id);
        
        if (exists) {
          set({ wishlist: wishlist.filter(item => item.id !== product.id) });
          
          if (userId) {
            await supabase
              .from('wishlists')
              .delete()
              .match({ user_id: userId, product_id: product.id }); // Sesuaikan kolom
          }
        } else {
          set({ wishlist: [...wishlist, product] });
          
          if (userId) {
            await supabase
              .from('wishlists')
              .insert([{ user_id: userId, product_id: product.id }]); // Sesuaikan kolom
          }
        }
      },

      isInWishlist: (id) => {
        return get().wishlist.some(item => item.id === id);
      },

      deleteAllWishlistFromDB: async (userId) => {
        set({ wishlist: [] });
        
        if (userId) {
          await supabase
            .from('wishlists')
            .delete()
            .eq('user_id', userId); // Sesuaikan kolom
        }
      },

      clearWishlist: () => set({ wishlist: [] }),
    }),
    {
      name: 'warhope_wishlist', 
    }
  )
);