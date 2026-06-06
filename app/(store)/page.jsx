"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Star,
  Leaf,
  Quote,
  Truck,
  RefreshCcw,
  Lock,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background pb-0 overflow-hidden">
      {/* 1. HERO SECTION - Menggunakan Banner Lokal */}
      <section className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-4xl overflow-hidden min-h-[70vh] flex items-center group shadow-2xl bg-slate-900">
          {/* Gambar Banner Utama */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/warhope-og-banner.png"
            alt="Warhope Collection"
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000"
          />

          {/* Efek Gradasi agar teks selalu terbaca di atas gambar apa pun */}
          <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/50 to-transparent"></div>

          <div className="relative z-10 p-8 sm:p-12 md:p-16 max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div></div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter leading-[1.1]">
              Elevasi Gaya <br className="hidden sm:block" />
              <span className="text-blue-400">Esensial Harian.</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-300 font-medium leading-relaxed max-w-xl">
              Warhope merancang pakaian yang memahami pergerakan Anda. Material
              premium bernapas yang dipadukan dengan siluet oversized modern
              untuk kenyamanan tanpa kompromi.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-start gap-4">
              <Link
                href="/katalog"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-black text-sm transition-all shadow-xl shadow-blue-600/30 active:scale-95 group/btn"
              >
                Mulai Belanja{" "}
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FITUR & KEUNTUNGAN BELANJA (Store Benefits) */}
      <section className="bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
            <div className="flex items-center gap-4 py-4 sm:py-0 sm:px-6">
              <Truck className="w-8 h-8 text-blue-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-foreground">
                  Pengiriman Cepat
                </h4>
                <p className="text-xs text-foreground/60 mt-1">
                  Terintegrasi dengan kurir terbaik nasional.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 py-4 sm:py-0 sm:px-6">
              <RefreshCcw className="w-8 h-8 text-blue-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-foreground">
                  Garansi Tukar Size
                </h4>
                <p className="text-xs text-foreground/60 mt-1">
                  Kebesaran/kekecilan? Tukar gratis.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 py-4 sm:py-0 sm:px-6">
              <Lock className="w-8 h-8 text-blue-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-foreground">
                  Pembayaran Aman
                </h4>
                <p className="text-xs text-foreground/60 mt-1">
                  Dienkripsi penuh oleh sistem DOKU.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VALUE PROPOSITION (USP Produk) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">
            Mengapa Warhope?
          </h2>
          <h3 className="text-3xl md:text-4xl font-black text-foreground">
            Kualitas yang Berbicara
          </h3>
        </div>

        {/* PERBAIKAN: grid-cols-2 membuat tampilan mobile langsung berjejer 2 kolom, lg:grid-cols-4 untuk desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {/* CARD 1: MATERIAL */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-sm sm:text-xl font-bold text-foreground mb-2 sm:mb-3">
                Katun Premium Terpilih
              </h4>
              <p className="text-[11px] sm:text-sm text-foreground/60 leading-relaxed">
                Ketebalan bahan (gramasi) yang telah diriset khusus untuk iklim
                tropis. Menyerap keringat maksimal tanpa terasa tipis atau
                menerawang di badan.
              </p>
            </div>
          </div>

          {/* CARD 2: CUTTING */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-sm sm:text-xl font-bold text-foreground mb-2 sm:mb-3">
                Siluet Proporsional
              </h4>
              <p className="text-[11px] sm:text-sm text-foreground/60 leading-relaxed">
                Bukan sekadar besar. Potongan boxy dan bahu jatuh (drop
                shoulder) kami dihitung secara presisi agar memberikan kesan
                tegap pada postur tubuh Anda.
              </p>
            </div>
          </div>

          {/* CARD 3: DURABILITY */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-sm sm:text-xl font-bold text-foreground mb-2 sm:mb-3">
                Daya Tahan Tinggi
              </h4>
              <p className="text-[11px] sm:text-sm text-foreground/60 leading-relaxed">
                Jahitan rantai ganda pada kerah dan pundak untuk memastikan
                pakaian tidak mudah melar meskipun telah melewati puluhan kali
                siklus pencucian.
              </p>
            </div>
          </div>

          {/* CARD 4: ARTWORK (Kelebihan Baru yang Ditambahkan) */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-sm sm:text-xl font-bold text-foreground mb-2 sm:mb-3">
                Grafis Orisinal Terbatas
              </h4>
              <p className="text-[11px] sm:text-sm text-foreground/60 leading-relaxed">
                Setiap artikel diproduksi secara terbatas dengan rilisan desain
                grafis orisinal berkarakter urban. Menghindarkan Anda dari
                risiko baju kembar di jalanan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VISUAL LOOKBOOK / PINTU KATEGORI */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Banner Utama - Menggunakan gambar sekunder (opsional, jika Anda punya gambar lain) */}
            <Link
              href="/katalog"
              className="lg:col-span-8 group relative rounded-3xl overflow-hidden aspect-video lg:aspect-auto bg-slate-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=1200"
                alt="T-Shirt Collection"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 sm:p-12">
                <span className="text-white/80 text-sm font-bold uppercase tracking-widest mb-2 block">
                  Jelajahi Semua
                </span>
                <h3 className="text-3xl sm:text-4xl font-black text-white mb-4">
                  Katalog Lengkap
                </h3>
                <span className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold text-sm shadow-xl hover:bg-slate-200 transition-colors">
                  Eksplorasi Katalog <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>

            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Banner Outerwear */}
              <Link
                href="/katalog"
                className="flex-1 group relative rounded-3xl overflow-hidden aspect-square lg:aspect-auto bg-slate-900"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800"
                  alt="Hoodie Collection"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 grayscale-20"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8">
                  <h3 className="text-2xl font-black text-white mb-3">
                    Hoodie & Jaket
                  </h3>
                  <span className="text-white/90 text-sm font-medium hover:underline flex items-center gap-1">
                    Lihat Koleksi <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>

              {/* Banner Bawahan */}
              <Link
                href="/katalog"
                className="flex-1 group relative rounded-3xl overflow-hidden aspect-square lg:aspect-auto bg-slate-900"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800"
                  alt="Pants Collection"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 grayscale-20"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8">
                  <h3 className="text-2xl font-black text-white mb-3">
                    Celana Kasual
                  </h3>
                  <span className="text-white/90 text-sm font-medium hover:underline flex items-center gap-1">
                    Lihat Koleksi <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TENTANG KAMI & TESTIMONI (Social Proof) */}
      <section
        id="filosofi"
        className="bg-slate-50 dark:bg-black mt-24 pt-24 pb-20 border-t border-slate-200 dark:border-slate-900 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto">
          {/* BAGIAN FILOSOFI BRAND */}
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-20">
              <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-6">
                Filosofi <span className="text-blue-600">Warhope.</span>
              </h2>
              <p className="text-base sm:text-lg text-foreground/70 leading-relaxed mb-6">
                Berawal dari frustrasi mencari pakaian lokal yang tahan banting
                untuk menemani mobilitas tinggi. Warhope dirancang untuk menjadi
                &quot;seragam andalan&quot; Anda—pakaian yang selalu Anda ambil
                pertama kali dari lemari tanpa perlu berpikir panjang.
              </p>
              <p className="text-base sm:text-lg text-foreground/70 leading-relaxed font-bold">
                Kualitas di atas kuantitas. Fungsi yang bersanding manis dengan
                estetika.
              </p>
            </div>
          </div>

          {/* BAGIAN KATA MEREKA / TESTIMONIALS */}
          <div className="px-4 sm:px-6 lg:px-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">
                Kata Mereka
              </h2>
              <h3 className="text-3xl md:text-4xl font-black text-foreground">
                Dipercaya Streetwear Enthusiast
              </h3>
            </div>
          </div>

          {/* 
      HORIZONTAL SCROLL PADA MOBILE, GRID PADA DESKTOP 
      Di mobile, kita menggunakan trik snap-x dengan margin negatif untuk ujung ke ujung.
    */}
          <div className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory hide-scrollbar gap-4 sm:gap-6 pb-8 px-4 sm:px-6 lg:px-8">
            {/* KARTU 1 */}
            <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shrink-0 w-[85vw] md:w-auto snap-center sm:snap-start transition-all hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md group flex flex-col justify-between">
              <Quote className="absolute top-6 right-6 w-12 h-12 text-slate-100 dark:text-slate-800/50 -z-10 rotate-12 transition-transform group-hover:rotate-0" />

              <div className="z-10">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="w-3 h-3 shrink-0" />
                    <span className="text-[9px] font-bold uppercase tracking-wider hidden xs:block">
                      Pembeli
                    </span>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed font-medium mb-8">
                  &quot;Bahan katunnya beneran adem buat cuaca panas di kota.
                  Cuttingan boxy-nya pas banget di badan, nggak kelihatan
                  gombrong berlebihan. Auto jadi kaos andalan buat ke
                  kampus.&quot;
                </p>
              </div>

              <div className="flex items-center gap-4 z-10 mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm shrink-0">
                  F
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-sm text-foreground truncate">
                    Fayyadh P.
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 truncate">
                    Mahasiswa
                  </p>
                </div>
              </div>
            </div>

            {/* KARTU 2 */}
            <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shrink-0 w-[85vw] md:w-auto snap-center sm:snap-start transition-all hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md group flex flex-col justify-between">
              <Quote className="absolute top-6 right-6 w-12 h-12 text-slate-100 dark:text-slate-800/50 -z-10 rotate-12 transition-transform group-hover:rotate-0" />

              <div className="z-10">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="w-3 h-3 shrink-0" />
                    <span className="text-[9px] font-bold uppercase tracking-wider hidden xs:block">
                      Pembeli
                    </span>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed font-medium mb-8">
                  &quot;Jarang nemu brand lokal yang perhatiin proporsi panjang
                  kaos vs lebarnya. Warhope dapet banget fit-nya. Jahitannya
                  rapi dan pengirimannya super cepat.&quot;
                </p>
              </div>

              <div className="flex items-center gap-4 z-10 mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm shrink-0">
                  R
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-sm text-foreground truncate">
                    Rizky Aditya
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 truncate">
                    Content Creator
                  </p>
                </div>
              </div>
            </div>

            {/* KARTU 3 */}
            <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shrink-0 w-[85vw] md:w-auto snap-center sm:snap-start transition-all hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md group flex flex-col justify-between">
              <Quote className="absolute top-6 right-6 w-12 h-12 text-slate-100 dark:text-slate-800/50 -z-10 rotate-12 transition-transform group-hover:rotate-0" />

              <div className="z-10">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="w-3 h-3 shrink-0" />
                    <span className="text-[9px] font-bold uppercase tracking-wider hidden xs:block">
                      Pembeli
                    </span>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed font-medium mb-8">
                  &quot;Sudah cuci berkali-kali pakai mesin dan kerahnya nggak
                  melar sama sekali. Warnanya juga solid nggak gampang pudar.
                  Totally worth the price!&quot;
                </p>
              </div>

              <div className="flex items-center gap-4 z-10 mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-sm shrink-0">
                  S
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-sm text-foreground truncate">
                    Sarah A.
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 truncate">
                    Graphic Designer
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* HINT GESER UNTUK MOBILE SAJA */}
          <div className="flex justify-center mt-2 md:hidden animate-pulse">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
              <ArrowRight className="w-3 h-3" /> Geser untuk ulasan lainnya
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
