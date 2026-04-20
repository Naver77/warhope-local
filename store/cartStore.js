import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      // Menambah barang ke keranjang (jika sudah ada, qty ditambah)
      addItem: (product) => {
        const items = get().items;
        const existingItem = items.find(item => item.id === product.id && item.selectedColor === product.selectedColor && item.selectedSize === product.selectedSize);
        
        if (existingItem) {
          set({ items: items.map(item => item === existingItem ? { ...item, quantity: item.quantity + product.quantity } : item) });
        } else {
          set({ items: [...items, product] });
        }
      },

      // Menghapus barang spesifik
      removeItem: (id, color, size) => {
        set({ items: get().items.filter(item => !(item.id === id && item.selectedColor === color && item.selectedSize === size)) });
      },

      // Mengubah Qty langsung dari halaman Cart
      updateQuantity: (id, color, size, newQuantity) => {
        if (newQuantity < 1) return;
        set({ items: get().items.map(item => (item.id === id && item.selectedColor === color && item.selectedSize === size) ? { ...item, quantity: newQuantity } : item) });
      },

      // LOGIKA CERDAS: Mengubah Ukuran / Warna langsung dari Cart
      updateVariant: (id, oldColor, oldSize, newColor, newSize) => {
        const items = get().items;
        const targetItem = items.find(i => i.id === id && i.selectedColor === oldColor && i.selectedSize === oldSize);
        if (!targetItem) return;

        // Mengecek apakah varian tujuan (baru) sudah ada di keranjang
        const existingNewVariant = items.find(i => i.id === id && i.selectedColor === newColor && i.selectedSize === newSize);

        if (existingNewVariant) {
          // JIKA SUDAH ADA: Gabungkan Qty ke varian yang sudah ada, lalu hapus varian lama
          const newItems = items.map(i => {
            if (i === existingNewVariant) return { ...i, quantity: i.quantity + targetItem.quantity };
            return i;
          }).filter(i => !(i.id === id && i.selectedColor === oldColor && i.selectedSize === oldSize));
          
          set({ items: newItems });
        } else {
          // JIKA BELUM ADA: Cukup ubah properti size/color dari barang tersebut
          set({
            items: items.map(i => i === targetItem ? { ...i, selectedColor: newColor, selectedSize: newSize } : i)
          });
        }
      },

      // Kosongkan seluruh keranjang (saat selesai checkout)
      clearCart: () => set({ items: [] }),
      
      // Hitung total harga
      getTotalPrice: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),
    }),
    {
      name: 'warhope_cart', // Disimpan di Local Storage agar tidak hilang saat di-refresh
    }
  )
);