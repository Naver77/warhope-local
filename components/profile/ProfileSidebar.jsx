import React from "react";
import { Package, Settings, LogOut } from "lucide-react";

export default function ProfileSidebar({ user, activeTab, setActiveTab, promptLogout }) {
  if (!user) return null;

  return (
    <div className="lg:col-span-3 space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center font-black text-2xl mb-4 uppercase tracking-widest">
          {user.name ? user.name.charAt(0) : "W"}
        </div>
        <h2 className="font-bold text-foreground text-lg">
          {user.name || "Pengguna Warhope"}
        </h2>
        <p className="text-sm text-foreground/60 mb-6">{user.email}</p>
        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
          Member
        </span>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col gap-2">
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all w-full text-left ${activeTab === "orders" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "text-foreground/70 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-foreground"}`}
        >
          <Package className="w-5 h-5" /> Pesanan Saya
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all w-full text-left ${activeTab === "settings" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "text-foreground/70 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-foreground"}`}
        >
          <Settings className="w-5 h-5" /> Pengaturan
        </button>
        <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
        <button
          onClick={promptLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all w-full text-left"
        >
          <LogOut className="w-5 h-5" /> Keluar
        </button>
      </div>
    </div>
  );
}