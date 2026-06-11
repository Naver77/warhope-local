import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      // ✅ SINKRONISASI COCOK UNTUK HIGH-TRAFFIC (BULK UPSERT)
      syncCartFromDB: async (userId) => {
        if (!userId) return;
        try {
          const localItems = get().items;
          
          // OPTIMASI: Kirim semua barang sekaligus dalam 1 request (Bukan looping)
          if (localItems.length > 0) {
            const upsertPayload = localItems.map(item => ({
              user_id: userId,
              product_id: item.id,
              quantity: item.quantity,
              selected_size: item.selectedSize || '-',
              selected_color: item.selectedColor || '-'
            }));

            await supabase
              .from('cart_items')
              .upsert(upsertPayload, { onConflict: 'user_id, product_id, selected_size, selected_color' });
          }

          // Tarik data terbaru dari DB setelah proses Merge
          const { data, error } = await supabase
            .from('cart_items')
            .select('quantity, selected_size, selected_color, products(*)')
            .eq('user_id', userId);

          if (data && !error) {
            const syncedItems = data.map(dbItem => ({
              ...dbItem.products,
              quantity: dbItem.quantity,
              selectedSize: dbItem.selected_size === '-' ? null : dbItem.selected_size,
              selectedColor: dbItem.selected_color === '-' ? null : dbItem.selected_color,
              finalPrice: dbItem.products.final_price ?? dbItem.products.price,
            }));
            
            set({ items: syncedItems });
          }
        } catch (error) {
          console.error("Gagal sinkronisasi keranjang:", error);
        }
      },

      // ✅ 2. ADD ITEM (Optimistic Update)
      addItem: async (product, userId = null) => {
        const items = get().items;
        const existingItem = items.find(item => item.id === product.id && item.selectedColor === product.selectedColor && item.selectedSize === product.selectedSize);
        
        if (existingItem) {
          const newQty = existingItem.quantity + product.quantity;
          set({ items: items.map(item => item === existingItem ? { ...item, quantity: newQty } : item) });
          
          if (userId) {
            supabase.from('cart_items').update({ quantity: newQty })
              .match({ user_id: userId, product_id: product.id, selected_size: product.selectedSize || '-' });
          }
        } else {
          set({ items: [...items, product] });
          
          if (userId) {
            supabase.from('cart_items').insert([{
              user_id: userId,
              product_id: product.id,
              quantity: product.quantity,
              selected_size: product.selectedSize || '-',
              selected_color: product.selectedColor || '-'
            }]);
          }
        }
      },

      // ✅ 3. REMOVE ITEM
      removeItem: async (id, color, size, userId = null) => {
        set({ items: get().items.filter(item => !(item.id === id && item.selectedColor === color && item.selectedSize === size)) });
        
        if (userId) {
          supabase.from('cart_items').delete()
            .match({ user_id: userId, product_id: id, selected_size: size || '-' });
        }
      },

      // ✅ 4. UPDATE QUANTITY
      updateQuantity: async (id, color, size, newQuantity, userId = null) => {
        if (newQuantity < 1) return;
        set({ items: get().items.map(item => (item.id === id && item.selectedColor === color && item.selectedSize === size) ? { ...item, quantity: newQuantity } : item) });
        
        if (userId) {
          supabase.from('cart_items').update({ quantity: newQuantity })
            .match({ user_id: userId, product_id: id, selected_size: size || '-' });
        }
      },

      updateVariant: (id, oldColor, oldSize, newColor, newSize) => {
        // Karena logika varian cukup kompleks (harus update row di DB atau merge jika duplikat), 
        // Anda bisa memanggil api lokal dari komponen jika ingin ini tersinkron sempurna.
        // Untuk saat ini, fungsi lokal dipertahankan.
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

      // ✅ 5. CLEAR CART (Dipanggil setelah Checkout)
      clearCart: async (userId = null) => {
        set({ items: [] });
        if (userId) {
          supabase.from('cart_items').delete().eq('user_id', userId);
        }
      },
      
      getTotalPrice: () => get().items.reduce((total, item) => {
        const priceToUse = item.finalPrice ?? item.final_price ?? item.price;
        return total + (priceToUse * item.quantity);
      }, 0),
      
      getOriginalTotalPrice: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),

      updateCartData: (syncedItems) => set({ items: syncedItems })
    }),
    {
      name: 'warhope_cart', 
    }
  )
);