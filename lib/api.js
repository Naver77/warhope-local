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
    if (error.message?.includes("Lock broken") || error.name === "AbortError") {
      if (retries > 0) {
        console.warn(
          `[Auto-Retry] Menunggu antrean Supabase... Sisa percobaan: ${retries}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
        return getAllProducts(retries - 1);
      }
    }
    console.error("Error fetching products:", error.message);
    return [];
  }
};

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
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Gagal memuat ulasan:", error.message);
    return [];
  }
};

export const addProductReview = async (payload) => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert([payload])
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Gagal mengirim ulasan:", error.message);
    throw error;
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
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching provinces:", error.message);
    return [];
  }
};

// ==========================================
// MANAJEMEN STOK & PESANAN (Telah Dioptimasi)
// ==========================================

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
        await new Promise((resolve) => setTimeout(resolve, 500));
        return getAllOrders(retries - 1);
      }
    }
    console.error("Error fetching all orders for admin:", error.message);
    return [];
  }
};

// Memanggil fungsi Postgres (RPC) untuk memotong stok dengan aman dari Race Condition
export const reduceProductStock = async (
  productId,
  quantityToReduce,
  selectedSize,
) => {
  const { error } = await supabase.rpc("checkout_decrement_stock", {
    p_product_id: productId,
    p_size: selectedSize,
    p_quantity: quantityToReduce,
  });

  if (error) throw error;
};

// Fungsi ini tetap digunakan sebagai Fallback/Rollback jika terjadi error di tengah checkout
export const restoreOrderStock = async (cartItems) => {
  try {
    if (!cartItems || cartItems.length === 0) return;

    await Promise.all(
      cartItems.map(async (item) => {
        const { data: product } = await supabase
          .from("products")
          .select("sizes, stock")
          .eq("id", item.id)
          .single();

        if (product && product.sizes) {
          let sizesMatrix =
            typeof product.sizes === "string"
              ? JSON.parse(product.sizes)
              : product.sizes;

          if (sizesMatrix[item.selectedSize]) {
            const currentSizeStock = sizesMatrix[item.selectedSize].stock || 0;
            sizesMatrix[item.selectedSize].stock =
              currentSizeStock + item.quantity;

            const currentGlobalStock = parseInt(product.stock) || 0;
            const newGlobalStock = currentGlobalStock + item.quantity;

            await supabase
              .from("products")
              .update({
                sizes: sizesMatrix,
                stock: newGlobalStock,
              })
              .eq("id", item.id);
          }
        }
      }),
    );
  } catch (error) {
    console.error("Gagal mengembalikan stok (Rollback Error):", error.message);
  }
};

export const createOrder = async (orderPayload, cartItems) => {
  // Array untuk mencatat barang apa saja yang sudah berhasil dipotong stoknya
  const successfulDecrements = [];

  try {
    // 1. POTONG STOK TERLEBIH DAHULU (Berurutan agar aman)
    for (const item of cartItems) {
      await reduceProductStock(item.id, item.quantity, item.selectedSize);
      successfulDecrements.push(item);
    }

    // 2. BERSIHKAN PAYLOAD (Hapus kolom 'items' yang berupa JSONB agar tidak ada redundansi)
    const cleanOrderPayload = { ...orderPayload };
    delete cleanOrderPayload.items;

    // 3. BUAT HEADER PESANAN DI TABEL orders
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert([cleanOrderPayload])
      .select()
      .single();

    if (orderError) throw orderError;

    // 4. MASUKKAN DETAIL BARANG KE TABEL order_items
    if (cartItems && cartItems.length > 0) {
      const orderItemsPayload = cartItems.map((item) => ({
        order_id: newOrder.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price_at_purchase: item.finalPrice ?? item.final_price ?? item.price,
        selected_size: item.selectedSize,
        selected_color: item.selectedColor,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsPayload);
      if (itemsError) throw itemsError;
    }

    return newOrder;
  } catch (error) {
    console.error("Error creating order:", error.message);

    // ROLLBACK: Jika di tengah proses gagal (misal koneksi terputus atau insert gagal),
    // kembalikan stok barang yang sudah terlanjur dipotong di langkah 1.
    if (successfulDecrements.length > 0) {
      console.warn("Melakukan rollback stok untuk pesanan yang gagal...");
      await restoreOrderStock(successfulDecrements);
    }

    throw error;
  }
};

// ==========================================
// KATEGORI
// ==========================================

export const getCategories = async (retries = 3) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("name")
      .order("name");
    if (error) throw error;
    return data.map((c) => c.name) || [];
  } catch (error) {
    if (error.message?.includes("Lock broken") || error.name === "AbortError") {
      if (retries > 0) {
        console.warn(
          `[Auto-Retry] Menunggu antrean Supabase (Kategori)... Sisa: ${retries}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
        return getCategories(retries - 1);
      }
    }
    console.error("Error fetching categories:", error.message);
    return [];
  }
};

export const addCategory = async (name) => {
  try {
    const { error } = await supabase.from("categories").insert([{ name }]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error adding category:", error.message);
    throw error;
  }
};

export const deleteCategoryByName = async (name) => {
  try {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("name", name);
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

export const getUserOrders = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching user orders:", error.message);
    return [];
  }
};

export const markOrderAsCompleted = async (orderId) => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ status: "COMPLETED" })
      .eq("id", orderId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error completing order:", error.message);
    throw error;
  }
};

export const submitReview = async (reviewData) => {
  try {
    const { error } = await supabase.from("reviews").insert([reviewData]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error submitting review:", error.message);
    throw error;
  }
};

export const getUserProfile = async (userId, retries = 3) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, role, phone_number, address")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    if (
      error.message?.includes("Lock broken") ||
      error.name === "AbortError" ||
      error.message?.includes("steal")
    ) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return getUserProfile(userId, retries - 1);
      }
    }
    console.error("Gagal mengambil profil user:", error.message);
    return null;
  }
};
