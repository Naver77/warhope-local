import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full rounded-t-[2.5rem] mt-12 bg-white border-t border-slate-100 text-sm tracking-wide">
      <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div>
          <div className="text-xl font-black text-slate-900 uppercase tracking-widest mb-6">Warhope</div>
          <p className="text-slate-500 leading-relaxed mb-4">Mendefinisikan gaya kasual modern melalui kualitas, presisi, dan kurasi editorial terbaik.</p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Layanan Pelanggan</h4>
          <ul className="space-y-3">
            <li><a className="text-slate-500 hover:text-blue-600 transition-colors" href="#">Pengiriman & Lacak</a></li>
            <li><a className="text-slate-500 hover:text-blue-600 transition-colors" href="#">Kebijakan Pengembalian</a></li>
            <li><a className="text-slate-500 hover:text-blue-600 transition-colors" href="#">Hubungi Kami</a></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Perusahaan</h4>
          <ul className="space-y-3">
            <li><a className="text-slate-500 hover:text-blue-600 transition-colors" href="#">Tentang Kami</a></li>
            <li><a className="text-slate-500 hover:text-blue-600 transition-colors" href="#">Kebijakan Privasi</a></li>
            <li><a className="text-slate-500 hover:text-blue-600 transition-colors" href="#">Syarat & Ketentuan</a></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Berlangganan</h4>
          <div className="flex gap-2 relative">
            <input 
              className="bg-slate-50 border border-slate-200 rounded-full pl-5 pr-12 py-3 w-full text-sm focus:ring-2 ring-blue-500 outline-none transition-all" 
              placeholder="Alamat Email" 
              type="email"
            />
            <button className="absolute right-1.5 top-1.5 bottom-1.5 w-9 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-8 pb-10">
        <div className="pt-8 border-t border-slate-100 text-slate-400 text-xs uppercase tracking-widest flex flex-col md:flex-row justify-between items-center gap-4">
          <span>© 2024 Warhope E-Commerce. Hak cipta dilindungi.</span>
          <div className="flex gap-6 font-medium">
            <a href="#" className="hover:text-slate-900 transition-colors">Instagram</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  );
}