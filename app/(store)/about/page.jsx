"use client";

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, ArrowRight, CheckCircle, ShieldCheck, Scissors } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background pt-20 pb-24">
      
      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-20 lg:mb-32">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          <div className="lg:w-1/2 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold uppercase tracking-widest text-foreground/70">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Sejak 2020
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-tight">
              Karya Asli dari <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
                Jantung Kota Bogor.
              </span>
            </h1>
            <p className="text-lg text-foreground/70 leading-relaxed max-w-xl">
              <strong className="text-foreground">Warhope</strong> adalah sebuah brand custom t-shirt yang lahir dari semangat kebebasan berekspresi. Kami percaya bahwa pakaian bukan sekadar penutup tubuh, melainkan kanvas kosong tempat karakter dan identitas Anda berbicara.
            </p>
            <div className="flex gap-4 pt-4">
              <Link href="/#katalog" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-full font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 hover:opacity-90">
                Lihat Koleksi Kami <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
          <div className="lg:w-1/2 w-full relative animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
            <div className="aspect-square md:aspect-4/3 rounded-4xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
              {/* Gambar Abstrak/Kreatif Placeholder */}
              <div className="absolute inset-0 bg-linear-to-tr from-slate-200 to-slate-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=2069&auto=format&fit=crop" 
                  alt="Warhope Workshop" 
                  className="w-full h-full object-cover opacity-90"
                />
              </div>
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -bottom-8 -left-8 md:bottom-8 md:-left-12 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 hidden sm:flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600">
                <Scissors className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-xl text-foreground">100%</p>
                <p className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Custom Crafted</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE VALUES SECTION */}
      <section className="bg-slate-50 dark:bg-slate-900 py-20 lg:py-32 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-4">Filosofi Kami</h2>
            <p className="text-foreground/60">Tiga pilar utama yang mendasari setiap helai benang dan potongan kain yang kami produksi di workshop Warhope.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                <Scissors className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Custom Presisi</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">Dari pemilihan material hingga teknik jahitan, setiap detail dapat disesuaikan untuk menciptakan produk yang eksklusif milik Anda.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Kualitas Premium</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">Kami hanya menggunakan 100% material cotton pilihan terbaik yang telah teruji kenyamanan dan keawetannya.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Layanan Terpercaya</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">Dari Bogor ke seluruh Indonesia, kami menjamin kepuasan pelanggan dengan garansi penuh dan dukungan yang responsif.</p>
            </div>
          </div>
        </div>
      </section>

      {/* KONTAK DAN LOKASI */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          <div className="lg:w-1/2 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-6">Workshop Kami</h2>
            <p className="text-lg text-foreground/70 leading-relaxed mb-10">
              Tertarik bekerja sama atau ingin melihat langsung kualitas bahan kami? Pintu workshop kami di Bogor selalu terbuka lebar. Hubungi tim kami melalui kontak di bawah.
            </p>
            
            <div className="space-y-8 mt-12">
              <div className="flex gap-6 group">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <MapPin className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2">Alamat Lengkap</h4>
                  <p className="font-semibold text-foreground text-base leading-relaxed">
                    Jl. Palayu VI No.68, RT.03/RW.07<br />
                    Tegal Gundil, Bogor Utara - Kota<br />
                    Kota Bogor, Jawa Barat, ID, 16152
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6 group cursor-pointer" onClick={() => window.location.href = 'tel:081288111154'}>
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <Phone className="w-8 h-8" />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2">Telepon / WhatsApp</h4>
                  <p className="font-bold text-foreground text-xl">0812 - 8811 - 1154</p>
                </div>
              </div>
              
              <div className="flex gap-6 group cursor-pointer" onClick={() => window.location.href = 'mailto:hendipratama045@gmail.com'}>
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <Mail className="w-8 h-8" />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-2">Email Kami</h4>
                  <p className="font-bold text-foreground text-xl">hendipratama045@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:w-1/2 w-full animate-in fade-in slide-in-from-right-8 duration-700 delay-500">
            {/* GOOGLE MAPS PLACEHOLDER / AESTHETIC CARD */}
            <div className="w-full h-full min-h-100 bg-slate-100 dark:bg-slate-900 rounded-4xl border border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-inner p-8 flex flex-col items-center justify-center text-center">
              <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/5 opacity-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-size-[16px_16px]"></div>
              
              <div className="z-10 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-sm">
                <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-black text-foreground mb-2">Warhope HQ</h3>
                <p className="text-sm text-foreground/60 leading-relaxed mb-6">
                  Terletak di jantung kota hujan. Kami menyambut siapapun yang ingin berdiskusi mengenai proyek custom fashion selanjutnya.
                </p>
                <button 
                  onClick={() => window.open('https://maps.google.com/?q=Jl.+Palayu+VI+No.68,+Tegal+Gundil,+Bogor+Utara', '_blank')}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-full font-bold hover:bg-blue-600 hover:text-white transition-colors shadow-md active:scale-95"
                >
                  Buka di Google Maps
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}