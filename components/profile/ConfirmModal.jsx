import React from "react";
import { LogOut, CheckCircle, AlertCircle } from "lucide-react";

export default function ConfirmModal({ isOpen, type, title, message, onConfirm, onCancel, isProcessing }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${type === "logout" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : type === "complete_order" ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-red-100 dark:bg-red-900/30 text-red-600"}`}>
            {type === "logout" ? <LogOut className="w-8 h-8" /> : type === "complete_order" ? <CheckCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
          <p className="text-foreground/60 text-sm mb-8 whitespace-pre-line leading-relaxed">{message}</p>
          <div className="flex gap-3 w-full">
            <button onClick={onCancel} className="flex-1 py-3 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Batal</button>
            <button onClick={onConfirm} disabled={isProcessing} className={`flex-1 py-3 rounded-full font-bold text-white transition-colors disabled:opacity-70 shadow-lg ${type === "logout" ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20" : type === "complete_order" ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"}`}>
              {isProcessing ? "Memproses..." : "Ya, Lanjutkan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}