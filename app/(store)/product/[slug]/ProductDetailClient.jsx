"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation"; // TAMBAHAN: usePathname untuk mendapatkan URL saat ini
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Minus, Plus, ShoppingBag, ShieldCheck,
  Star, MessageSquare, MessageCircle, PaintBucket,
} from "lucide-react";

import { useCartStore } from "../../../../store/cartStore";
import { useAuthStore } from "../../../../store/authStore";
import { useToastStore } from "../../../../store/toastStore";

export default function ProductDetailClient({ initialProduct, initialReviews }) {
  const router = useRouter();
  const pathname = usePathname(); // Untuk mendapatkan path "/product/slug-produk"

  const [product] = useState(initialProduct);
  const [reviews] = useState(initialReviews || []);
  
  const [selectedColor] = useState("Default");
  const [activeTab, setActiveTab] = useState("deskripsi");
  const [quantity, setQuantity] = useState(1);

  const { user } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const addItem = useCartStore((state) => state.addItem);

  let sizeObj = {};
  if (typeof product.sizes === "string") {
    try { sizeObj = JSON.parse(product.sizes); } catch {}
  } else if (product.sizes && typeof product.sizes === "object") {
    sizeObj = product.sizes;
  }

  const [availableSizes] = useState(sizeObj);
  
  const firstAvailable = Object.entries(sizeObj).find(([, data]) => data.active && data.stock > 0);
  const [selectedSize, setSelectedSize] = useState(firstAvailable ? firstAvailable[0] : "");

  const currentMaxStock = availableSizes[selectedSize]?.stock || 0;
  const isGlobalOutOfStock = product.stock <= 0;

  const discountPercent = parseInt(product.discount) || 0;
  const hasDiscount = discountPercent > 0;
  const displayPrice = product.final_price ?? product.price;

  const handleSizeClick = (size) => {
    setSelectedSize(size);
    setQuantity(1);
  };

  const increaseQuantity = () => {
    if (quantity < currentMaxStock) setQuantity((q) => q + 1);
    else addToast(`Maksimal pembelian ukuran ini adalah ${currentMaxStock} pcs`, "error");
  };

  const decreaseQuantity = () => setQuantity((q) => Math.max(1, q - 1));

  const formatRupiah = (number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);
    
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  // === PERBAIKAN LOGIC AUTHENTICATION ===
  const handleAddToCart = () => {
    if (!user) {
      addToast("Silakan login terlebih dahulu untuk mulai belanja.", "error");
      // Redirect ke /auth/login dan bawa URL produk saat ini sebagai parameter
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`); 
      return;
    }
    if (isGlobalOutOfStock || currentMaxStock === 0) return addToast("Maaf, produk ini sedang habis.", "error");
    if (!selectedSize) return addToast("Pilih ukuran terlebih dahulu.", "error");

    addItem({ ...product, finalPrice: displayPrice, selectedColor, selectedSize, quantity });
    addToast(`${quantity}x ${product.name} (Size: ${selectedSize}) masuk ke keranjang!`, "success");
  };

  const handleBuyNow = () => {
    if (!user) {
      addToast("Silakan login terlebih dahulu untuk membeli.", "error");
      // Redirect ke /auth/login dan bawa URL produk saat ini sebagai parameter
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (isGlobalOutOfStock || currentMaxStock === 0) return addToast("Maaf, produk ini sedang habis.", "error");
    if (!selectedSize) return addToast("Pilih ukuran terlebih dahulu.", "error");

    addItem({ ...product, finalPrice: displayPrice, selectedColor, selectedSize, quantity });
    router.push("/checkout");
  };
  // ======================================

  const averageRating = reviews.length > 0
      ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
      : "0.0";

  const clientName = user?.user_metadata?.full_name || user?.name || "Pelanggan";
  const waMessage = encodeURIComponent(
    `Halo Admin Warhope, saya *${clientName}*.\n\n` +
    `Saya tertarik dengan produk *${product.name}* (ID: ${product.id}).\n\n` +
    `Saya ingin bertanya soal modifikasi / custom desain untuk produk ini. Apakah bisa dibantu?`
  );
  const waLink = `https://wa.me/6281288111154?text=${waMessage}`;

  return (
    <nav className="min-h-screen bg-background pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        <Link href="/katalog" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors font-medium mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Katalog
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="relative aspect-4/5 md:aspect-square bg-slate-100 dark:bg-slate-800 rounded-4xl overflow-hidden p-4 group">
              <div className="w-full h-full rounded-3xl overflow-hidden relative">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  priority 
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              
              <div className="absolute top-8 left-8 flex flex-col items-start gap-2">
                <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-foreground shadow-sm">
                  {product.category}
                </span>
                {hasDiscount && (
                  <span className="bg-red-600 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-md animate-in zoom-in">
                    -{discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-4xl p-6 md:p-8 shadow-sm flex flex-col">
              <div className="flex overflow-x-auto hide-scrollbar gap-6 border-b border-slate-200 dark:border-slate-700 mb-6 pb-2 shrink-0">
                <button type="button" onClick={() => setActiveTab("deskripsi")} className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors relative ${activeTab === "deskripsi" ? "text-blue-600" : "text-foreground/50"}`}>
                  Deskripsi {activeTab === "deskripsi" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full -mb-2.5"></span>}
                </button>
                <button type="button" onClick={() => setActiveTab("spesifikasi")} className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors relative ${activeTab === "spesifikasi" ? "text-blue-600" : "text-foreground/50"}`}>
                  Spesifikasi {activeTab === "spesifikasi" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full -mb-2.5"></span>}
                </button>
                <button type="button" onClick={() => setActiveTab("ulasan")} className={`pb-2 whitespace-nowrap text-sm font-bold transition-colors relative flex items-center gap-2 ${activeTab === "ulasan" ? "text-blue-600" : "text-foreground/50"}`}>
                  Ulasan <span className="bg-slate-100 dark:bg-slate-700 text-[10px] px-2 py-0.5 rounded-full">{reviews.length}</span>
                  {activeTab === "ulasan" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full -mb-2.5"></span>}
                </button>
              </div>

              <div className="text-foreground/70 text-sm leading-relaxed flex-1 flex flex-col">
                {activeTab === "deskripsi" && (
                  <div className="animate-in fade-in flex-1 flex flex-col">
                    <p className="whitespace-pre-line">{product.description}</p>
                    <p className="mt-4 mb-8">Setiap produk Warhope dirancang dengan mengutamakan keseimbangan antara fungsionalitas dan estetika jalanan modern.</p>
                    {/* FIX: Ubah bg-gradient-to-br menjadi bg-linear-to-br */}
                    <div className="bg-linear-to-br from-[#E8F9F0] to-[#F2FBF6] dark:from-[#112A1F] dark:to-[#0A1A13] border border-[#BDE7D0] dark:border-[#1E4D39] rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-sm mt-auto">
                      <div className="w-14 h-14 bg-white dark:bg-[#1A3F2E] text-[#25D366] rounded-2xl flex items-center justify-center shrink-0 z-10"><PaintBucket className="w-7 h-7" /></div>
                      <div className="flex-1 z-10">
                        <h4 className="text-base sm:text-lg font-black text-[#136B34] dark:text-[#4ADE80]">Punya Desain Sendiri?</h4>
                        <p className="text-xs sm:text-sm text-[#225534]/80 dark:text-[#A7F3D0]/70 mt-1">Modifikasi apparel ini dengan sablon logo komunitas, ubah warna kain, atau request ukuran khusus.</p>
                      </div>
                      <a href={waLink} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-lg flex items-center justify-center gap-2 z-10 shrink-0">
                        <MessageCircle className="w-5 h-5" /> Hubungi Admin
                      </a>
                    </div>
                  </div>
                )}
                
                {activeTab === "spesifikasi" && (
                  <div className="animate-in fade-in space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <tbody>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-3 font-bold text-foreground/50 w-40">Kategori</td>
                            <td className="py-3 text-foreground font-semibold">{product.category}</td>
                          </tr>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-3 font-bold text-foreground/50">Material</td>
                            <td className="py-3 text-foreground font-semibold">Heavyweight Cotton Premium 24s</td>
                          </tr>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-3 font-bold text-foreground/50">Potongan (Fit)</td>
                            <td className="py-3 text-foreground font-semibold">Modern Boxy / Drop Shoulder Oversized</td>
                          </tr>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-3 font-bold text-foreground/50">Berat Produk</td>
                            <td className="py-3 text-foreground font-semibold">{product.weight || 500} Gram</td>
                          </tr>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-3 font-bold text-foreground/50">Kondisi</td>
                            <td className="py-3 text-foreground font-semibold">Baru (Original Warhope Apparel)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {activeTab === "ulasan" && (
                  <div className="animate-in fade-in space-y-8">
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-6">
                      <div className="text-center md:text-left">
                        <h3 className="text-5xl font-black text-foreground">{averageRating}</h3>
                        <div className="flex text-amber-400 mt-2 mb-1 justify-center md:justify-start">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-4 h-4 ${star <= Math.round(parseFloat(averageRating)) ? "fill-current" : "text-slate-200 dark:text-slate-700"}`} />
                          ))}
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dari {reviews.length} Ulasan</p>
                      </div>
                      <div className="flex-1 text-xs text-slate-500 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <span className="font-bold text-blue-600 dark:text-blue-400">Penting:</span> Untuk menjaga keaslian ulasan, hanya pelanggan yang telah membeli dan menerima produk ini (Verified Buyer) yang dapat memberikan penilaian.
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-2">Penilaian Pembeli</h4>
                      {reviews.length === 0 ? (
                        <div className="text-center py-8 text-foreground/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-transparent flex flex-col items-center gap-3">
                          <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                          <p>Belum ada ulasan. Jadilah yang pertama memiliki artikel ini!</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                          {/* FIX: Hapus `: any` dan `: number` */}
                          {reviews.map((review, idx) => (
                            <div key={review.id || idx} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/30 shadow-sm animate-in fade-in duration-300">
                              <div className="flex justify-between items-start gap-4 mb-2">
                                <div>
                                  <p className="font-bold text-foreground text-sm flex items-center gap-1.5">{review.user_name} <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5"><ShieldCheck className="w-2 h-2" /> Pembeli</span></p>
                                  <p className="text-[10px] text-foreground/40 mt-0.5">{review.created_at ? formatDate(review.created_at) : "Baru saja"}</p>
                                </div>
                                <div className="flex text-yellow-400 gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star className={`w-3.5 h-3.5 ${i < review.rating ? "fill-current" : "text-slate-200 dark:text-slate-800"}`} key={i} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-foreground/80 leading-relaxed font-medium mt-2 whitespace-pre-line">{review.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-start">
            <div className="sticky top-28 bg-white dark:bg-slate-800/30 p-6 md:p-8 rounded-4xl border border-transparent dark:border-slate-800 shadow-sm">
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-3 leading-tight">{product.name}</h1>
                <div className="flex items-center gap-3 mb-6 cursor-pointer" onClick={() => setActiveTab("ulasan")}>
                  <div className="flex text-yellow-400"><Star className="w-4 h-4 fill-current" /></div>
                  <span className="font-bold text-foreground text-sm">{averageRating}</span>
                  <span className="text-sm font-medium text-blue-600 hover:underline">({reviews.length} Ulasan)</span>
                </div>
                
                <div className="flex flex-wrap items-baseline gap-3 mb-4">
                  <p className="text-3xl lg:text-4xl font-black text-foreground">
                    {formatRupiah(displayPrice)}
                  </p>
                  {hasDiscount && (
                    <p className="text-lg lg:text-xl font-medium text-slate-400 dark:text-slate-500 line-through decoration-red-500/50">
                      {formatRupiah(product.price)}
                    </p>
                  )}
                </div>

                <div className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full ${currentMaxStock > 0 ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
                  <span className="relative flex h-2 w-2">
                    {currentMaxStock > 0 ? (
                      <><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    )}
                  </span>
                  Stok {selectedSize ? `Size ${selectedSize}` : "Total"}: {currentMaxStock > 0 ? currentMaxStock : "Habis"}
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-800 mb-8" />

              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60">Ukuran</h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {/* FIX: Hapus `: any` */}
                  {Object.entries(availableSizes).filter(([, data]) => data.active).map(([size, data]) => {
                    const isOutOfStock = data.stock <= 0;
                    return (
                      <button
                        type="button"
                        key={size}
                        onClick={() => handleSizeClick(size)}
                        disabled={isOutOfStock}
                        className={`h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all border ${selectedSize === size ? "border-blue-600 bg-blue-600 text-white shadow-md" : isOutOfStock ? "border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600 cursor-not-allowed" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 text-foreground hover:border-slate-400 dark:hover:border-slate-500"}`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col mb-6 gap-4">
                <div className={`flex items-center justify-between bg-slate-50 dark:bg-slate-900 rounded-2xl px-2 py-2 w-full sm:w-32 border ${currentMaxStock === 0 ? "opacity-50 pointer-events-none border-slate-100 dark:border-slate-800" : "border-slate-200 dark:border-slate-700"}`}>
                  <button type="button" onClick={decreaseQuantity} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 text-foreground transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="font-bold text-foreground w-8 text-center">{quantity}</span>
                  <button type="button" onClick={increaseQuantity} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 text-foreground transition-colors"><Plus className="w-4 h-4" /></button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button type="button" onClick={handleAddToCart} disabled={isGlobalOutOfStock || currentMaxStock === 0} className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground px-4 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <ShoppingBag className="w-5 h-5" /> Keranjang
                  </button>
                  <button type="button" onClick={handleBuyNow} disabled={isGlobalOutOfStock || currentMaxStock === 0} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-4 rounded-2xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    Beli Langsung
                  </button>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/10 rounded-2xl p-4 flex items-center gap-3 border border-green-100 dark:border-green-900/20">
                <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-500 shrink-0" />
                <p className="text-xs text-green-800 dark:text-green-400 font-medium leading-relaxed">Garansi retur gratis dalam 7 hari. Pembayaran diamankan oleh sistem enkripsi terkini.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}