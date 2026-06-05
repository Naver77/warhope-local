import { supabase } from "./supabase";

export const getAllProducts = async (retries = 3) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    // Jika error karena tabrakan sistem (Lock broken), lakukan percobaan ulang otomatis
    if (error.message?.includes("Lock broken") || error.name === "AbortError") {
      if (retries > 0) {
        console.warn(`[Auto-Retry] Menunggu antrean Supabase... Sisa percobaan: ${retries}`);
        // Tunggu 500 milidetik sebelum mencoba lagi
        await new Promise(resolve => setTimeout(resolve, 500)); 
        return getAllProducts(retries - 1);
      }
    }
    
    console.error("Error fetching products:", error.message);
    return [];
  }
};

// Mengambil satu produk berdasarkan ID (Untuk Detail Produk)
export const getProductById = async (id) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching single product:", error.message);
    return null;
  }
};

export const addProduct = async (productData) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert([productData])
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding product:", error.message);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .update(productData)
      .eq("id", id)
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating product:", error.message);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting product:", error.message);
    throw error;
  }
};

// ==========================================
// FITUR ULASAN (REVIEWS)
// ==========================================

export const getProductReviews = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Gagal memuat ulasan:', error.message);
    return [];
  }
};

export const addProductReview = async (payload) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([payload])
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Gagal mengirim ulasan:', error.message);
    throw error;
  }
};

// ==========================================
// MANAJEMEN STOK & PESANAN
// ==========================================

// --- FUNGSI YANG HILANG (DITAMBAHKAN KEMBALI) ---
export const getAllOrders = async (retries = 3) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    if (error.message?.includes("Lock broken") || error.name === "AbortError") {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 500)); 
        return getAllOrders(retries - 1);
      }
    }
    console.error("Error fetching all orders for admin:", error.message);
    return [];
  }
};
// ------------------------------------------------

export const getProvinces = async () => {
  try {
    const { data, error } = await supabase
      .from("provinces")
      .select("*")
      .order("cost", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching provinces:", error.message);
    return [];
  }
};

export const reduceProductStock = async (productId, quantityToReduce, selectedSize) => {
  try {
    const { data: product } = await supabase
      .from("products")
      .select("sizes")
      .eq("id", productId)
      .single();
      
    if (product && product.sizes) {
      let sizesMatrix = typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes;
      
      if (sizesMatrix[selectedSize]) {
        const currentStock = sizesMatrix[selectedSize].stock || 0;
        sizesMatrix[selectedSize].stock = Math.max(0, currentStock - quantityToReduce);
        
        await supabase
          .from("products")
          .update({ sizes: sizesMatrix })
          .eq("id", productId);
      }
    }
  } catch (error) {
    console.error("Gagal potong stok:", error.message);
  }
};

export const restoreOrderStock = async (cartItems) => {
  try {
    if (!cartItems || cartItems.length === 0) return;
    
    // Mengeksekusi pengembalian stok secara bersamaan (paralel) agar lebih cepat
    await Promise.all(cartItems.map(async (item) => {
      const { data: product } = await supabase.from('products').select('sizes').eq('id', item.id).single();
      
      if (product && product.sizes) {
        let sizesMatrix = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
        
        if (sizesMatrix[item.selectedSize]) {
          const currentStock = sizesMatrix[item.selectedSize].stock || 0;
          sizesMatrix[item.selectedSize].stock = currentStock + item.quantity;
          
          await supabase.from('products').update({ sizes: sizesMatrix }).eq('id', item.id);
        }
      }
    }));
  } catch (error) {
    console.error("Gagal mengembalikan stok:", error.message);
  }
};

export const createOrder = async (orderPayload, cartItems) => {
  try {
    const { data: newOrder, error } = await supabase
      .from("orders")
      .insert([orderPayload])
      .select()
      .single();
      
    if (error) throw error;

    if (cartItems && cartItems.length > 0) {
      await Promise.all(cartItems.map(item => reduceProductStock(item.id, item.quantity, item.selectedSize)));
    }
    
    return newOrder;
  } catch (error) {
    console.error("Error creating order:", error.message);
    throw error;
  }
};

// ==========================================
// KATEGORI
// ==========================================

export const getCategories = async (retries = 3) => {
  try {
    const { data, error } = await supabase.from('categories').select('name').order('name');
    if (error) throw error;
    return data.map(c => c.name) || [];
  } catch (error) {
    if (error.message?.includes("Lock broken") || error.name === "AbortError") {
      if (retries > 0) {
        console.warn(`[Auto-Retry] Menunggu antrean Supabase (Kategori)... Sisa: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, 500)); 
        return getCategories(retries - 1);
      }
    }
    console.error("Error fetching categories:", error.message);
    return [];
  }
};

export const addCategory = async (name) => {
  try {
    const { error } = await supabase.from('categories').insert([{ name }]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error adding category:", error.message);
    throw error;
  }
};

export const deleteCategoryByName = async (name) => {
  try {
    const { error } = await supabase.from('categories').delete().eq('name', name);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting category:", error.message);
    throw error;
  }
};

// ==========================================
// PELACAKAN PESANAN & ULASAN USER
// ==========================================

// Tarik pesanan khusus untuk User yang sedang login
export const getUserOrders = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching user orders:", error.message);
    return [];
  }
};

// User mengonfirmasi barang diterima (Ubah status jadi COMPLETED)
export const markOrderAsCompleted = async (orderId) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'COMPLETED' })
      .eq('id', orderId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error completing order:", error.message);
    throw error;
  }
};

// Kirim Ulasan Produk
export const submitReview = async (reviewData) => {
  try {
    const { error } = await supabase.from('reviews').insert([reviewData]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error submitting review:", error.message);
    throw error;
  }
};