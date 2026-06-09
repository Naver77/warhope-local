import { notFound } from "next/navigation";
import { getProductById, getProductReviews } from "../../../../lib/api";
import ProductDetailClient from "./ProductDetailClient";

export default async function ProductDetailServer({ params }) {
  // 1. WAJIB di-await karena pada Next.js versi terbaru, params adalah sebuah Promise
  const resolvedParams = await params;
  const id = resolvedParams?.id || resolvedParams?.slug;

  // Jika ID tidak ditemukan di URL, langsung tampilkan 404
  if (!id) {
    notFound();
  }

  let product = null;
  let reviews = [];

  try {
    // 2. Ambil data secara paralel dari database Supabase
    const [fetchedProduct, fetchedReviews] = await Promise.all([
      getProductById(id),
      getProductReviews(id)
    ]);
    
    product = fetchedProduct;
    reviews = fetchedReviews;
  } catch (error) {
    console.error("Gagal mengambil data produk di server:", error);
  }

  // 3. Jika ID ada tapi produknya memang tidak terdaftar di DB, tampilkan 404
  if (!product) {
    notFound();
  }

  // 4. Kirim data yang sukses diambil ke komponen Client
  return <ProductDetailClient initialProduct={product} initialReviews={reviews} />;
}