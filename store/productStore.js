import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAllProducts } from '../lib/api';

// Tentukan umur cache sebelum boleh fetch API lagi (Contoh: 5 Menit)
// Ini menyelamatkan kuota database dari refresh berulang oleh user
const CACHE_TTL = 5 * 60 * 1000; 

export const useProductStore = create(
  persist(
    (set, get) => ({
      products: [],
      isLoading: false,
      lastFetched: null,
      error: null, // Tambahan state untuk mendeteksi kegagalan sinkronisasi
      
      fetchProducts: async (force = false) => {
        const now = Date.now();
        const { products, lastFetched } = get();

        // OPTIMASI 1: Cache Cooldown
        // Jangan tembak API jika data masih "segar" (kurang dari 5 menit), KECUALI dipaksa
        if (!force && lastFetched && (now - lastFetched < CACHE_TTL)) {
          return; 
        }

        // OPTIMASI 2: Instan UX yang lebih aman
        if (products.length === 0 || force) {
          set({ isLoading: true, error: null });
        }

        try {
          // Fetch data dari server (berjalan di background jika products sudah ada isinya)
          const data = await getAllProducts();
          
          set({ 
            products: data || [], 
            isLoading: false, 
            lastFetched: now,
            error: null 
          });
        } catch (error) {
          console.error("Gagal memuat produk:", error);
          set({ 
            isLoading: false, 
            error: "Gagal menyinkronkan data terbaru. Menampilkan data offline." 
            // PERHATIAN: Jangan set products: [] di sini, biarkan cache lama tetap tampil!
          });
        }
      },

      // Ambil detail produk langsung dari memori tanpa loading
      getProductByIdLocal: (id) => {
        if (!id) return null;
        
        const { products } = get();
        // OPTIMASI 3: Keamanan tipe data
        // Gunakan String() untuk memastikan tidak ada bug '1' === 1 (String vs Number)
        return products.find(p => String(p.id) === String(id)) || null;
      }
    }),
    {
      name: 'warhope-catalog-cache', // Nama brankas di LocalStorage browser
    }
  )
);