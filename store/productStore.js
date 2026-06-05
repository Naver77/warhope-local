import { create } from 'zustand';
import { getAllProducts } from '../lib/api';

export const useProductStore = create((set, get) => ({
  products: [],
  isLoading: false,
  isFetched: false, // Menandakan apakah data sudah pernah ditarik

  // Fungsi pintar untuk menarik data
  fetchProducts: async (forceRefresh = false) => {
    // Jika data sudah ada di memori dan tidak dipaksa refresh, BATALKAN penarikan ke database (UX INSTAN)
    if (get().isFetched && !forceRefresh) return;

    set({ isLoading: true });
    try {
      const data = await getAllProducts();
      set({ products: data, isFetched: true });
    } catch (error) {
      console.error("Gagal menarik data produk dari store:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));