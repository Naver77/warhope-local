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
  console.log("=== MEMULAI CREATE ORDER (TRANSACTION) ===");
  
  // 1. Bersihkan payload order agar tidak ada duplikasi data JSON
  const cleanOrderPayload = { ...orderPayload };
  delete cleanOrderPayload.items;

  // 2. Pastikan mapping cartItems sesuai dengan format yang dibaca oleh RPC SQL di atas
  // Kita pastikan id dan selectedSize terdefinisi dengan jelas
  const cleanCartItems = cartItems.map(item => ({
    id: String(item.id).trim(), // .trim() mencegah error karena spasi tersembunyi
    name: item.name,
    quantity: Number(item.quantity),
    price_at_purchase: item.finalPrice ?? item.final_price ?? item.price,
    selectedSize: item.selectedSize ? String(item.selectedSize).trim() : null,
    selectedColor: item.selectedColor || null
  }));

  // 3. Eksekusi single-call RPC ke Supabase
  const { data, error } = await supabase
    .rpc('process_checkout_transaction', {
      order_payload: cleanOrderPayload,
      cart_items: cleanCartItems
    });

  if (error) {
    console.error("Error dari Database Transaction:", error.message, error.details);
    throw new Error(error.message || "Gagal memproses pesanan di database.");
  }

  console.log("=== CREATE ORDER BERHASIL ===");
  return data;
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
      .maybeSingle();

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

// ==========================================
// OPTIMASI ADMIN PANEL (Super Cepat)
// ==========================================

export const getAdminProductsSummary = async () => {
  try {
    // ✅ HANYA ambil kolom yang ditampilkan di tabel (Tanpa description & sizes JSON yang berat)
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, price, discount, final_price, stock, image")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching admin products:", error.message);
    return [];
  }
};

export const getAdminOrdersSummary = async (limit = null) => {
  try {
    // ✅ HANYA ambil data ringkas untuk tabel. Abaikan detail item pesanan yang berat jika tidak perlu.
    let query = supabase
      .from("orders")
      .select(
        "id, invoice_number, created_at, status, total_amount, customer_name, customer_email, payment_method",
      )
      .order("created_at", { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching admin orders:", error.message);
    return [];
  }
};
