import React, { useState } from "react";
import { Send, AlertTriangle } from "lucide-react";

export default function OrderActionModal({
  actionModal,
  onClose,
  onSubmit,
  isUpdatingStatus,
}) {
  const [trackingInput, setTrackingInput] = useState("");
  const [courierInput, setCourierInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...actionModal,
      trackingNumber: trackingInput.trim().toUpperCase(), // Otomatis format ke huruf besar
      courier: courierInput,
    });
  };

  // VALIDASI KETAT: Tombol simpan hanya aktif jika resi minimal 8 karakter
  const isFormValid = actionModal.requiresResi 
    ? courierInput !== "" && trackingInput.trim().length >= 8
    : true;

  if (!actionModal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-130 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            {actionModal.requiresResi ? (
              <Send className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {actionModal.requiresResi ? "Kirim Pesanan" : "Konfirmasi Aksi"}
          </h3>
          <p className="text-foreground/60 text-sm mb-6">
            {actionModal.requiresResi
              ? "Pilih kurir dan masukkan nomor resi untuk memudahkan pelanggan melacak paketnya."
              : `Anda yakin ingin mengubah status pesanan ini menjadi ${actionModal.newStatus}?`}
          </p>

          <form onSubmit={handleSubmit} className="text-left">
            {actionModal.requiresResi && (
              <>
                <div className="mb-4">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">
                    Pilih Kurir
                  </label>
                  <select
                    required
                    value={courierInput}
                    onChange={(e) => setCourierInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground font-medium"
                  >
                    <option value="" disabled>-- Pilih Ekspedisi --</option>
                    <option value="JNE">JNE</option>
                    <option value="J&T Express">J&T Express</option>
                    <option value="SiCepat">SiCepat</option>
                    <option value="AnterAja">AnterAja</option>
                    <option value="Ninja Xpress">Ninja Xpress</option>
                    <option value="GrabExpress">GrabExpress</option>
                    <option value="GoSend">GoSend</option>
                    <option value="Lainnya">Lainnya...</option>
                  </select>
                </div>
                <div className="mb-6">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">
                    Nomor Resi <span className="text-[9px] text-red-500 font-normal ml-1">(Minimal 8 Karakter)</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={8}
                    placeholder="Contoh: JX1234567890"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground font-medium tracking-wide uppercase"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isUpdatingStatus || !isFormValid}
                className="flex-1 py-3 rounded-full font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
              >
                {isUpdatingStatus ? "Memproses..." : "Ya, Lanjutkan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}