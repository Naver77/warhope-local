"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Mail, Phone, ChevronDown } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-12 md:pt-16 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-y-0 md:gap-12 mb-12">
        
        {/* Kolom 1: Brand Info */}
        <div className="md:col-span-1 pb-8 md:pb-0 mb-4 md:mb-0 border-b border-slate-200 dark:border-slate-800 md:border-none">
          <p className="text-sm text-foreground/60 leading-relaxed max-w-xs mb-6">
            Definisikan ulang gaya kasual dengan sentuhan modern. Warhope menghadirkan pakaian berkualitas tinggi untuk kenyamanan harian Anda.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/warhope1/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-foreground/60 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-foreground/60 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-foreground/60 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
          </div>
        </div>

        {/* Kolom 2: Tautan Cepat */}
        <div className="border-b border-slate-200 dark:border-slate-800 md:border-none">
          <button 
            onClick={() => toggleSection('tautan')} 
            className="w-full flex justify-between items-center py-4 md:py-0 md:cursor-auto"
          >
            <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Tautan Cepat</h4>
            <ChevronDown className={`w-5 h-5 text-slate-400 md:hidden transition-transform duration-300 ${openSection === 'tautan' ? 'rotate-180' : ''}`} />
          </button>
          
          {/* PERBAIKAN: md:max-h-none! md:opacity-100! md:mt-4! */}
          <div className={`overflow-hidden transition-all duration-300 md:max-h-none! md:opacity-100! md:mt-4! ${openSection === 'tautan' ? 'max-h-64 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
            <ul className="space-y-3">
              <li><Link href="/" className="text-sm text-foreground/60 hover:text-blue-600 transition-colors">Beranda</Link></li>
              <li><Link href="/#katalog" className="text-sm text-foreground/60 hover:text-blue-600 transition-colors">Katalog Produk</Link></li>
              <li><Link href="/cart" className="text-sm text-foreground/60 hover:text-blue-600 transition-colors">Keranjang</Link></li>
              <li><Link href="/profile" className="text-sm text-foreground/60 hover:text-blue-600 transition-colors">Lacak Pesanan</Link></li>
            </ul>
          </div>
        </div>

        {/* Kolom 3: Layanan Pelanggan */}
        <div className="border-b border-slate-200 dark:border-slate-800 md:border-none">
          <button 
            onClick={() => toggleSection('bantuan')} 
            className="w-full flex justify-between items-center py-4 md:py-0 md:cursor-auto"
          >
            <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Bantuan</h4>
            <ChevronDown className={`w-5 h-5 text-slate-400 md:hidden transition-transform duration-300 ${openSection === 'bantuan' ? 'rotate-180' : ''}`} />
          </button>

          {/* PERBAIKAN: md:max-h-none! md:opacity-100! md:mt-4! */}
          <div className={`overflow-hidden transition-all duration-300 md:max-h-none! md:opacity-100! md:mt-4! ${openSection === 'bantuan' ? 'max-h-64 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-foreground/60 hover:text-blue-600 transition-colors">FAQ</Link></li>
              <li><Link href="#" className="text-sm text-foreground/60 hover:text-blue-600 transition-colors">Kebijakan Pengiriman</Link></li>
              <li><Link href="#" className="text-sm text-foreground/60 hover:text-blue-600 transition-colors">Kebijakan Pengembalian</Link></li>
              <li><Link href="#" className="text-sm text-foreground/60 hover:text-blue-600 transition-colors">Panduan Ukuran</Link></li>
            </ul>
          </div>
        </div>

        {/* Kolom 4: Kontak */}
        <div className="border-b border-slate-200 dark:border-slate-800 md:border-none">
          <button 
            onClick={() => toggleSection('kontak')} 
            className="w-full flex justify-between items-center py-4 md:py-0 md:cursor-auto"
          >
            <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Hubungi Kami</h4>
            <ChevronDown className={`w-5 h-5 text-slate-400 md:hidden transition-transform duration-300 ${openSection === 'kontak' ? 'rotate-180' : ''}`} />
          </button>

          {/* PERBAIKAN: md:max-h-none! md:opacity-100! md:mt-4! */}
          <div className={`overflow-hidden transition-all duration-300 md:max-h-none! md:opacity-100! md:mt-4! ${openSection === 'kontak' ? 'max-h-64 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground/60 leading-relaxed">Jl. Palayu VI No.68, RT.03/RW.07, Tegal Gundil, KOTA BOGOR, BOGOR UTARA - KOTA, JAWA BARAT, ID, 16152</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="text-sm text-foreground/60">081288111154</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="text-sm text-foreground/60">hendipratama045@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-foreground/50 font-medium text-center md:text-left">
          &copy; {currentYear} Warhope Apparel. Hak Cipta Dilindungi.
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-foreground/50 font-medium">
          <Link href="#" className="hover:text-foreground transition-colors">Privasi</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Syarat & Ketentuan</Link>
        </div>
      </div>
    </footer>
  );
}