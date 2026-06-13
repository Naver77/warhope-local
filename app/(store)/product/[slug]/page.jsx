import { getProductById, getProductReviews } from "../../../../lib/api";
import ProductDetailClient from "./ProductDetailClient";

export default async function ProductDetailServer({ params }) {
  const resolvedParams = await params;
  
  // ✅ 1. PASTIKAN ID DI-DECODE
  const rawId = resolvedParams?.id || resolvedParams?.slug;
  const id = rawId ? decodeURIComponent(rawId) : null;

  if (!id) {
    return <div className="p-20 text-center text-red-600 font-bold">ID Produk tidak terbaca dari URL.</div>;
  }

  let product = null;
  let reviews = [];
  let errorMessage = null;

  try {
    const [fetchedProduct, fetchedReviews] = await Promise.all([
      getProductById(id),
      getProductReviews(id)
    ]);
    
    product = fetchedProduct;
    reviews = fetchedReviews;
  } catch (error) {
    console.error("Gagal mengambil data produk di server:", error);
    errorMessage = error.message;
  }

  // ✅ 2. DEBUGGING SCREEN
  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black">!</div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Produk Tidak Ditemukan</h1>
          
          <div className="bg-slate-100 p-4 rounded-xl text-left mt-6 mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Log Debugging:</p>
            <p className="text-sm font-mono text-slate-700">Mencari ID: <span className="font-bold text-blue-600">&quot;{id}&quot;</span></p>
            {errorMessage && <p className="text-sm font-mono text-red-600 mt-2">Error: {errorMessage}</p>}
          </div>

          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Sistem membaca ID produk dari URL dengan benar, namun <strong>getProductById()</strong> gagal menemukan data tersebut di Supabase. 
          </p>

          <a href="/katalog" className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold inline-block hover:bg-blue-700 transition-colors">
            Kembali ke Katalog
          </a>
        </div>
      </div>
    );
  }

  return <ProductDetailClient initialProduct={product} initialReviews={reviews} />;
}