"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowLeft,
  ChevronRight,
  Tag,
} from "lucide-react";

import { useWishlistStore } from "../../../store/wishlistStore";
import { useCartStore } from "../../../store/cartStore";
import { useAuthStore } from "../../../store/authStore";
import { useToastStore } from "../../../store/toastStore";

// ----------------------------------------------------------------------
// KOMPONEN ITEM WISHLIST (Dengan Swipe-to-Delete, Penomoran, dan Diskon)
// ----------------------------------------------------------------------
const WishlistItem = ({
  product,
  index,
  onRemove,
  onMoveToCart,
  formatRupiah,
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);

  // Logika Sentuhan (Mobile Swipe)
  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;

    // Hanya izinkan geser ke kiri (maksimal -90px)
    if (diff < 0) {
      setTranslateX(Math.max(diff, -90));
    } else {
      setTranslateX(0);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    // Jika digeser lebih dari 40px, tahan posisi terbuka. Jika tidak, kembalikan ke 0.
    if (translateX < -40) {
      setTranslateX(-80);
    } else {
      setTranslateX(0);
    }
  };

  // LOGIKA DISKON
  const discountVal = parseInt(product.discount) || 0;
  const hasDiscount = discountVal > 0;
  const displayPrice = product.final_price ?? product.price;

  return (
    <div className="relative w-full rounded-2xl mb-4 bg-red-500 overflow-hidden group">
      {/* LAPISAN BELAKANG: Tombol Hapus (Terlihat saat di-swipe di Mobile) */}
      <div className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center">
        <button
          onClick={() => onRemove(product)}
          className="text-white flex flex-col items-center justify-center w-full h-full hover:bg-red-600 transition-colors active:scale-95"
        ></button>
      </div>

      {/* LAPISAN DEPAN: Kartu Produk */}
      <div
        className="relative w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex items-center gap-3 sm:gap-4 transition-transform ease-out z-10 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
        style={{
          transform: `translateX(${translateX}px)`,
          transitionDuration: isSwiping ? "0ms" : "300ms",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Nomor Urut */}
        <div className="w-6 sm:w-8 flex items-center justify-center shrink-0">
          <span className="text-lg sm:text-xl font-black text-slate-300 dark:text-slate-600">
            {index + 1}
          </span>
        </div>

        {/* Gambar Produk */}
        <Link
          href={`/product/${product.id}`}
          className="relative w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 block"
        >
          <Image
            src={product.image || "/assets/placeholder.png"}
            alt={product.name}
            fill
            sizes="96px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Informasi Produk & Harga */}
        <div className="flex-1 min-w-0 py-1">
          <Link href={`/product/${product.id}`}>
            <p className="text-[10px] sm:text-xs font-bold text-foreground/40 uppercase tracking-widest mb-0.5">
              {product.category}
            </p>
            <h3 className="text-sm sm:text-base font-bold text-foreground truncate hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
          </Link>

          <div className="mt-1 sm:mt-2">
            <p className="font-black text-blue-600 dark:text-blue-400 text-sm sm:text-base leading-none">
              {formatRupiah(displayPrice)}
            </p>
            {/* AREA HARGA CORET & LABEL DISKON */}
            {hasDiscount && (
              <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
                <span className="text-[10px] sm:text-xs text-slate-400 line-through decoration-red-500/50">
                  {formatRupiah(product.price)}
                </span>
                <span className="text-[9px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-in zoom-in">
                  <Tag className="w-2.5 h-2.5" /> -{discountVal}%
                </span>
              </div>
            )}
          </div>

          {/* Indikator geser untuk mobile (Membantu UX) */}
          <div className="flex md:hidden items-center gap-1 mt-2 text-[9px] text-slate-400 font-medium">
            <ChevronRight className="w-3 h-3" /> Geser ke kiri untuk hapus
          </div>
        </div>

        {/* Aksi Desktop (Tombol Keranjang & Hapus) */}
        <div className="hidden md:flex items-center gap-3 shrink-0 ml-4">
          <button
            onClick={() => onMoveToCart(product)}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" /> Masukkan Keranjang
          </button>
          <button
            onClick={() => onRemove(product)}
            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
            title="Hapus dari Wishlist"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Aksi Mobile (Hanya Tombol Keranjang, Hapus disembunyikan di swipe) */}
        <div className="md:hidden shrink-0 flex flex-col items-end justify-center">
          <button
            onClick={() => onMoveToCart(product)}
            className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all shadow-md active:scale-95"
            title="Masukkan Keranjang"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// HALAMAN UTAMA WISHLIST
// ----------------------------------------------------------------------
export default function WishlistPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { wishlist, toggleWishlist, deleteAllWishlistFromDB } =
    useWishlistStore();
  const { addItem } = useCartStore();
  const { user, isInitialized, checkAuth } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true);
      checkAuth();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkAuth]);

  useEffect(() => {
    if (isClient && isInitialized && !user) {
      addToast("Anda harus masuk (login) untuk melihat Wishlist.", "error");
      router.push("/auth/login");
    }
  }, [isClient, isInitialized, user, router, addToast]);

  const formatRupiah = (number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);

  const handleMoveToCart = (product) => {
    const defaultColor =
      Array.isArray(product.colors) && product.colors.length > 0
        ? product.colors[0]
        : "Default";

    let defaultSize = "All Size";
    if (product.sizes) {
      if (Array.isArray(product.sizes)) {
        defaultSize = product.sizes[0] || "All Size";
      } else {
        const parsedSizes =
          typeof product.sizes === "string"
            ? JSON.parse(product.sizes)
            : product.sizes;
        const activeSizes = Object.entries(parsedSizes).filter(
          ([, data]) => data.active,
        );
        if (activeSizes.length > 0) defaultSize = activeSizes[0][0];
      }
    }

    addItem({
      ...product,
      finalPrice: product.final_price ?? product.price,
      selectedColor: defaultColor,
      selectedSize: defaultSize,
      quantity: 1,
    });

    // PERBAIKAN: Masukkan user.email agar terhapus dari database
    toggleWishlist(product, user?.id);
    addToast(`${product.name} dipindahkan ke Keranjang!`, "success");
  };

  const handleRemove = (product) => {
    // PERBAIKAN: Masukkan user.email agar terhapus dari database
    toggleWishlist(product, user?.id);
    addToast(`${product.name} dihapus dari Wishlist.`, "info");
  };

  if (!isClient || !isInitialized || !user) {
    return <div className="min-h-screen bg-background pt-32 pb-24"></div>;
  }

  return (
    <main className="min-h-screen bg-background pt-20 pb-24 px-4 sm:px-6 max-w-4xl mx-auto">
      <Link
        href="/katalog"
        className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors font-medium mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Lanjut Belanja
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Wishlist Saya{" "}
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
          </h1>
          <p className="text-foreground/60 mt-2">
            Daftar produk yang Anda impikan. Wujudkan sekarang!
          </p>
        </div>

        {wishlist.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm("Yakin ingin mengosongkan semua wishlist?")) {
                // PERBAIKAN: Panggil fungsi hapus massal beserta email user
                deleteAllWishlistFromDB(user?.id);
                addToast("Wishlist berhasil dikosongkan.", "info");
              }
            }}
            className="text-sm font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-4 py-2.5 rounded-full transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Kosongkan Semua
          </button>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-4xl p-12 text-center flex flex-col items-center justify-center min-h-[50vh] shadow-sm animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Heart className="w-10 h-10 text-red-300 dark:text-red-800" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Wishlist Anda Kosong
          </h2>
          <p className="text-foreground/60 mb-8 max-w-md mx-auto">
            Anda belum menyimpan produk apa pun. Temukan gaya favorit Anda di
            katalog dan simpan di sini untuk dibeli nanti!
          </p>
          <Link
            href="/katalog"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-blue-600/30 active:scale-95 flex items-center gap-2"
          >
            Eksplorasi Katalog
          </Link>
        </div>
      ) : (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
          {wishlist.map((product, index) => (
            <WishlistItem
              key={product.id}
              product={product}
              index={index}
              onRemove={handleRemove}
              onMoveToCart={handleMoveToCart}
              formatRupiah={formatRupiah}
            />
          ))}
        </div>
      )}
    </main>
  );
}
