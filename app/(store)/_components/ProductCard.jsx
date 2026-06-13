import React from 'react';
import Link from 'next/link';
import AddToCartButton from './AddToCartButton';

export default function ProductCard({ product }) {
  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  // Menggunakan kolom product.stock global
  const globalStock = parseInt(product.stock) || 0;
  const isOutOfStock = globalStock <= 0;

  // Logika Diskon yang disederhanakan berdasarkan Schema DB
  const discountPercent = parseInt(product.discount) || 0;
  const hasDiscount = discountPercent > 0;
  
  // Menggunakan kolom final_price dari DB (fallback ke price jika null)
  const displayPrice = product.final_price ?? product.price;

  return (
    <div className="group relative bg-white dark:bg-slate-800/50 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      
      <Link href={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        
        <span className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-foreground shadow-sm">
          {product.category}
        </span>

        {/* Badge Diskon Kanan */}
        {hasDiscount && (
          <span className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md animate-in zoom-in">
            -{discountPercent}%
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm tracking-widest uppercase shadow-md">Stok Habis</span>
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <Link href={`/product/${product.id}`} className="flex-1">
          <h3 className="font-bold text-lg text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {product.name}
          </h3>
          
          {/* Area Harga */}
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <p className="text-xl font-black text-foreground">
              {formatRupiah(displayPrice)}
            </p>
            {hasDiscount && (
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500 line-through decoration-red-500/50">
                {formatRupiah(product.price)}
              </p>
            )}
          </div>
        </Link>

        {/* Tombol Add To Cart */}
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          {!isOutOfStock ? (
             <AddToCartButton product={product} /> 
          ) : (
             <button disabled className="w-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 py-3 rounded-xl font-bold text-sm cursor-not-allowed">Habis Terjual</button>
          )}
        </div>
      </div>
    </div>
  );
}