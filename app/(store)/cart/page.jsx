"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2, Minus, Plus, ShoppingBag, 
  ArrowRight, ShieldCheck, Heart, AlertCircle, CheckCircle2, XCircle, Tag, Loader2
} from "lucide-react";
import { useCartStore } from "../../../store/cartStore";
import { useAuthStore } from "../../../store/authStore";
import { useToastStore } from "../../../store/toastStore";
import { useWishlistStore } from "../../../store/wishlistStore";
import { supabase } from "../../../lib/supabase"; // Import Supabase

export default function CartPage() {
  const router = useRouter();
  const { user, isInitialized, checkAuth } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const { toggleWishlist } = useWishlistStore();

  const { items, removeItem, updateQuantity, updateVariant, getTotalPrice, getOriginalTotalPrice, updateCartData } = useCartStore();
  
  const [isClient, setIsClient] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true); // Indikator loading sinkronisasi database

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true);
      checkAuth();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkAuth]);

  // ✅ LOGIKA SINKRONISASI LIVE DATABASE
  useEffect(() => {
    if (!isClient) return;

    const syncLiveStock = async () => {
      if (items.length === 0) {
        setIsSyncing(false);
        return;
      }

      try {
        // Ambil semua ID unik yang ada di keranjang
        const itemIds = [...new Set(items.map(i => i.id))];
        
        // Tarik data terbaru dari Supabase
        const { data: liveProducts, error } = await supabase
          .from('products')
          .select('id, sizes, stock, price, final_price, discount, name, image')
          .in('id', itemIds);

        if (!error && liveProducts) {
          const syncedItems = items.map(cartItem => {
            const live = liveProducts.find(p => p.id === cartItem.id);
            
            // Jika barang sudah dihapus dari database oleh Admin
            if (!live) {
              return { ...cartItem, stock: 0, sizes: {}, isUnavailable: true };
            }

            return {
              ...cartItem,
              name: live.name,
              image: live.image,
              price: live.price,
              discount: live.discount,
              finalPrice: live.final_price ?? live.price,
              stock: live.stock,
              sizes: live.sizes, // Update JSONB ke versi terbaru
              isUnavailable: false
            };
          });

          // Timpa data di Local Storage dengan data terbaru
          updateCartData(syncedItems);
        }
      } catch (e) {
        console.error("Gagal sinkronisasi keranjang:", e);
      } finally {
        setIsSyncing(false);
      }
    };

    syncLiveStock();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]); // Hanya dijalankan sekali saat komponen dimuat

  useEffect(() => {
    if (isClient && isInitialized && !user) {
      addToast("Anda harus masuk (login) untuk melihat keranjang.", "error");
      router.push("/auth/login");
    }
  }, [isClient, isInitialized, user, router, addToast]);

  const formatRupiah = (number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);

  const handleMoveToWishlist = (item) => {
    toggleWishlist(item);
    removeItem(item.id, item.selectedColor, item.selectedSize);
    addToast(`${item.name} dipindahkan ke Wishlist`, "info");
  };

  // ✅ LOGIKA PENGECEKAN KERANJANG SEBELUM CHECKOUT
  const { hasInvalidItems, invalidMessage } = useMemo(() => {
    let invalid = false;
    let msg = "";

    for (const item of items) {
      if (item.isUnavailable) {
        invalid = true;
        msg = `Produk "${item.name}" sudah tidak tersedia.`;
        break;
      }

      let currentSizeStock = 0;
      if (item.sizes) {
        try {
          const parsedSizes = typeof item.sizes === "string" ? JSON.parse(item.sizes) : item.sizes;
          if (Array.isArray(parsedSizes)) {
            currentSizeStock = item.stock || 0;
          } else {
            currentSizeStock = parsedSizes[item.selectedSize]?.stock || 0;
          }
        } catch {
          currentSizeStock = item.stock || 0;
        }
      } else {
        currentSizeStock = item.stock || 0;
      }

      if (item.quantity > currentSizeStock) {
        invalid = true;
        msg = `Stok "${item.name}" ukuran ${item.selectedSize} hanya tersisa ${currentSizeStock}.`;
        break;
      }
    }

    return { hasInvalidItems: invalid, invalidMessage: msg };
  }, [items]);

  const handleCheckout = () => {
    if (hasInvalidItems) {
      addToast(invalidMessage, "error");
      return;
    }
    router.push('/checkout');
  };

  if (!isClient || !isInitialized || !user) {
    return <div className="min-h-screen bg-background pt-20 pb-24"></div>;
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background pt-20 pb-24 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600" />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">Keranjang Kosong</h2>
        <p className="text-foreground/60 mb-8 max-w-sm">Sepertinya Anda belum memilih produk apa pun. Yuk, temukan koleksi terbaik kami!</p>
        <Link href="/katalog" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2">
          Mulai Belanja <ArrowRight className="w-4 h-4" />
        </Link>
      </main>
    );
  }

  const originalTotal = getOriginalTotalPrice();
  const finalTotal = getTotalPrice();
  const totalDiscount = originalTotal - finalTotal;

  return (
    <main className="min-h-screen bg-background pt-20 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Cart</h1>
        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black text-sm px-3 py-1 rounded-full">
          {items.length} Barang
        </span>
        {isSyncing && (
          <span className="flex items-center gap-2 text-xs text-slate-400 animate-pulse ml-auto">
            <Loader2 className="w-3 h-3 animate-spin" /> Memeriksa ketersediaan...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-8 space-y-6">
          {items.map((item) => {
            const uniqueKey = `${item.id}-${item.selectedSize}`;

            let availableSizes = [];
            let currentSizeStock = 0;

            if (item.sizes) {
              try {
                const parsedSizes = typeof item.sizes === "string" ? JSON.parse(item.sizes) : item.sizes;
                
                if (Array.isArray(parsedSizes)) {
                  availableSizes = parsedSizes;
                  currentSizeStock = item.stock || 0; 
                } else {
                  availableSizes = Object.entries(parsedSizes)
                    .filter(([, data]) => data.active)
                    .map(([key]) => key);
                  
                  currentSizeStock = parsedSizes[item.selectedSize]?.stock || 0;
                }
              } catch {
                availableSizes = [item.selectedSize];
                currentSizeStock = item.stock || 0;
              }
            } else {
              availableSizes = [item.selectedSize];
              currentSizeStock = item.stock || 0;
            }

            const origPrice = Number(item.price) || 0;
            const finPrice = Number(item.finalPrice ?? item.final_price ?? origPrice);
            const hasDiscount = finPrice < origPrice;

            const isStockExceeded = item.quantity > currentSizeStock;

            return (
              <div key={uniqueKey} className={`bg-white dark:bg-slate-900 border ${isStockExceeded ? 'border-red-400 dark:border-red-900' : 'border-slate-200 dark:border-slate-800'} p-4 md:p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden shrink-0 relative group">
                  {hasDiscount && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-bl-xl z-10">SALE</div>
                  )}
                  <Link href={`/product/${item.id}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} className={`w-full h-full object-cover transition-transform duration-500 ${item.isUnavailable ? 'grayscale opacity-50' : 'group-hover:scale-105'}`} />
                  </Link>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1">{item.category}</p>
                      <Link href={`/product/${item.id}`} className="font-bold text-lg md:text-xl text-foreground hover:text-blue-600 transition-colors line-clamp-1">
                        {item.name}
                      </Link>
                      
                      <div className="mt-1 flex items-baseline gap-2">
                        <p className="font-black text-blue-600 dark:text-blue-400 text-lg">
                          {formatRupiah(finPrice)}
                        </p>
                        {hasDiscount && (
                          <p className="text-xs font-medium text-slate-400 line-through decoration-red-500/50">
                            {formatRupiah(origPrice)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => removeItem(item.id, item.selectedColor, item.selectedSize)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" title="Hapus barang">
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleMoveToWishlist(item)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all" title="Pindahkan ke Wishlist">
                        <Heart className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-end justify-between gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">Size:</span>
                        <select
                          value={item.selectedSize}
                          onChange={(e) => updateVariant(item.id, item.selectedColor, item.selectedSize, item.selectedColor, e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-foreground py-2 px-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer appearance-none min-w-16 text-center"
                        >
                          {availableSizes.map((size) => <option key={size} value={size}>{size}</option>)}
                        </select>
                      </div>
                      
                      {currentSizeStock === 0 ? (
                        <p className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Stok Habis
                        </p>
                      ) : currentSizeStock <= 5 ? (
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1 animate-pulse">
                          <AlertCircle className="w-3 h-3" /> Tersisa {currentSizeStock} pcs!
                        </p>
                      ) : (
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Stok Aman ({currentSizeStock})
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.id, item.selectedColor, item.selectedSize, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className={`font-bold text-sm w-4 text-center ${isStockExceeded ? 'text-red-500' : ''}`}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.selectedColor, item.selectedSize, item.quantity + 1)}
                          disabled={item.quantity >= currentSizeStock} 
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                          title={item.quantity >= currentSizeStock ? "Maksimal stok tercapai" : "Tambah jumlah"}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      {isStockExceeded && (
                        <span className="text-[9px] text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded animate-bounce">
                          Kurangi Qty
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-slate-900 dark:bg-slate-800 border border-transparent dark:border-slate-700 text-white p-6 md:p-8 rounded-3xl shadow-xl sticky top-28 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-xl font-bold tracking-tight mb-8">Ringkasan Belanja</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Harga Produk</span>
                <span className="font-medium text-white">{formatRupiah(originalTotal)}</span>
              </div>
              
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-red-400 flex items-center gap-1.5">
                    <Tag className="w-3 h-3" /> Diskon Produk
                  </span>
                  <span className="font-bold text-red-400">-{formatRupiah(totalDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Biaya Pengiriman</span>
                <span className="font-medium text-amber-400">Dihitung di Checkout</span>
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-between items-end mt-6">
                <span className="text-base font-bold">Total Sementara</span>
                <span className="text-2xl font-black tracking-tighter text-blue-400">
                  {formatRupiah(finalTotal)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {/* ✅ UPDATE: Tombol Checkout Tervalidasi */}
              <button 
                onClick={handleCheckout}
                disabled={isSyncing}
                className={`w-full py-4 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                  hasInvalidItems 
                    ? 'bg-slate-700 cursor-not-allowed opacity-80' 
                    : 'bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-blue-900/20'
                }`}
              >
                {isSyncing ? <><Loader2 className="w-5 h-5 animate-spin" /> Memeriksa...</> : 'Lanjut ke Checkout'} <ArrowRight className="w-5 h-5" />
              </button>
              
              <div className="bg-white/5 rounded-xl p-4 flex items-start gap-3 mt-4">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                  Transaksi Anda aman. Pastikan ukuran produk dan ketersediaan stok sudah sesuai sebelum melanjutkan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}