import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product) => {
        const items = get().items;
        const existingItem = items.find(item => item.id === product.id && item.selectedColor === product.selectedColor && item.selectedSize === product.selectedSize);
        
        if (existingItem) {
          set({ items: items.map(item => item === existingItem ? { ...item, quantity: item.quantity + product.quantity } : item) });
        } else {
          set({ items: [...items, product] });
        }
      },

      removeItem: (id, color, size) => {
        set({ items: get().items.filter(item => !(item.id === id && item.selectedColor === color && item.selectedSize === size)) });
      },

      updateQuantity: (id, color, size, newQuantity) => {
        if (newQuantity < 1) return;
        set({ items: get().items.map(item => (item.id === id && item.selectedColor === color && item.selectedSize === size) ? { ...item, quantity: newQuantity } : item) });
      },

      updateVariant: (id, oldColor, oldSize, newColor, newSize) => {
        const items = get().items;
        const targetItem = items.find(i => i.id === id && i.selectedColor === oldColor && i.selectedSize === oldSize);
        if (!targetItem) return;

        const existingNewVariant = items.find(i => i.id === id && i.selectedColor === newColor && i.selectedSize === newSize);

        if (existingNewVariant) {
          const newItems = items.map(i => {
            if (i === existingNewVariant) return { ...i, quantity: i.quantity + targetItem.quantity };
            return i;
          }).filter(i => !(i.id === id && i.selectedColor === oldColor && i.selectedSize === oldSize));
          
          set({ items: newItems });
        } else {
          set({
            items: items.map(i => i === targetItem ? { ...i, selectedColor: newColor, selectedSize: newSize } : i)
          });
        }
      },

      clearCart: () => set({ items: [] }),
      
      // ✅ UPDATE: Menghitung total menggunakan harga final/diskon
      getTotalPrice: () => get().items.reduce((total, item) => {
        const priceToUse = item.finalPrice ?? item.final_price ?? item.price;
        return total + (priceToUse * item.quantity);
      }, 0),
      
      // ✅ TAMBAHAN: Fungsi untuk mendapatkan total sebelum diskon (original)
      getOriginalTotalPrice: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),
    }),
    {
      name: 'warhope_cart', 
    }
  )
);