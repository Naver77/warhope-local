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

// ==========================================
// DATA WILAYAH & ONGKOS KIRIM
// ==========================================

export const getProvinces = async () => {
  try {
    const { data, error } = await supabase
      .from("provinces")
      .select("*")
      .order("name", { ascending: true }); // Diurutkan berdasarkan abjad A-Z agar UX Dropdown lebih baik

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching provinces:", error.message);
    return [];
  }
};

export const reduceProductStock = async (productId, quantityToReduce, selectedSize) => {
  try {
    // 1. Ambil sizes DAN stock global
    const { data: product } = await supabase
      .from("products")
      .select("sizes, stock") 
      .eq("id", productId)
      .single();
      
    if (product && product.sizes) {
      let sizesMatrix = typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes;
      
      if (sizesMatrix[selectedSize]) {
        // 2. Kurangi stok spesifik per ukuran
        const currentSizeStock = sizesMatrix[selectedSize].stock || 0;
        sizesMatrix[selectedSize].stock = Math.max(0, currentSizeStock - quantityToReduce);
        
        // 3. Kurangi stok global
        const currentGlobalStock = parseInt(product.stock) || 0;
        const newGlobalStock = Math.max(0, currentGlobalStock - quantityToReduce);
        
        // 4. Update keduanya ke database sekaligus
        await supabase
          .from("products")
          .update({ 
            sizes: sizesMatrix,
            stock: newGlobalStock 
          })
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
      // 1. Ambil sizes DAN stock global
      const { data: product } = await supabase
        .from('products')
        .select('sizes, stock')
        .eq('id', item.id)
        .single();
      
      if (product && product.sizes) {
        let sizesMatrix = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
        
        if (sizesMatrix[item.selectedSize]) {
          // 2. Kembalikan stok spesifik per ukuran
          const currentSizeStock = sizesMatrix[item.selectedSize].stock || 0;
          sizesMatrix[item.selectedSize].stock = currentSizeStock + item.quantity;
          
          // 3. Kembalikan stok global
          const currentGlobalStock = parseInt(product.stock) || 0;
          const newGlobalStock = currentGlobalStock + item.quantity;
          
          // 4. Update keduanya ke database sekaligus
          await supabase
            .from('products')
            .update({ 
              sizes: sizesMatrix,
              stock: newGlobalStock 
            })
            .eq('id', item.id);
        }
      }
    }));
  } catch (error) {
    console.error("Gagal mengembalikan stok:", error.message);
  }
};

export const createOrder = async (orderPayload, cartItems) => {
  try {
    // 1. Buat Header Pesanan (Struk Kasir) di tabel orders
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert([orderPayload])
      .select()
      .single();
      
    if (orderError) throw orderError;

    if (cartItems && cartItems.length > 0) {
      // 2. Siapkan data detail pesanan untuk tabel order_items
      const orderItemsPayload = cartItems.map(item => ({
        order_id: newOrder.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price_at_purchase: item.finalPrice ?? item.final_price ?? item.price,
        selected_size: item.selectedSize,
        selected_color: item.selectedColor
      }));

      // 3. Insert ke order_items & kurangi stok produk secara paralel
      await Promise.all([
        supabase.from("order_items").insert(orderItemsPayload),
        ...cartItems.map(item => reduceProductStock(item.id, item.quantity, item.selectedSize))
      ]);
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

// Fungsi untuk mengambil detail profil user dari tabel public.users
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, phone_number, address')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Gagal mengambil profil user:", error);
      return null;
    }
    return data;
  } catch (error) {
    console.error("Error getUserProfile:", error);
    return null;
  }
};