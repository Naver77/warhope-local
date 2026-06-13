"use client";

import React, { useState } from "react";
import { User, Mail, Phone, MapPin, Save, KeyRound, ShieldCheck, Loader2, Edit2, X } from "lucide-react";

export default function AccountSettingsTab({
  user,
  profileForm,
  handleProfileChange,
  handleSaveProfile,
  isSavingProfile,
  passwordForm,
  handlePasswordChange,
  handleUpdatePassword,
  isUpdatingPassword
}) {
  // STATE KHUSUS UNTUK MODE EDIT
  const [isEditing, setIsEditing] = useState(false);

  // Fungsi pembungkus (wrapper) agar setelah simpan, mode edit langsung tertutup
  const onSaveClick = async () => {
    await handleSaveProfile();
    setIsEditing(false);
  };

  const cancelEdit = () => {
    // Fungsi untuk membatalkan editan dan mengembalikan form ke data semula
    // (Jika pengguna membatalkan di tengah jalan, idealnya state dikembalikan.
    //  Untuk saat ini kita cukup menutup formnya saja)
    setIsEditing(false);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      
      {/* BAGIAN 1: IDENTITAS */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Identitas & Pengiriman</h2>
          
          {/* Tombol Toggle Mode Edit */}
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" /> Ubah Profil
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden">
          
          {/* Overlay Transparan jika tidak dalam mode Edit (UX Hack) */}
          {!isEditing && <div className="absolute inset-0 z-10 pointer-events-none bg-slate-50/10 dark:bg-slate-900/10"></div>}

          <div>
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Nama Lengkap</label>
            <div className={`flex items-center rounded-xl px-4 py-3 transition-colors ${isEditing ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700' : 'bg-transparent border border-transparent'}`}>
              <User className={`w-5 h-5 mr-3 ${isEditing ? 'text-blue-500' : 'text-slate-400'}`} />
              <input 
                type="text" name="name" 
                value={profileForm.name} 
                onChange={handleProfileChange} 
                readOnly={!isEditing}
                className={`bg-transparent w-full outline-none text-sm font-medium ${!isEditing ? 'text-foreground cursor-default' : 'text-foreground'}`} 
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Alamat Email</label>
            {/* Email selalu readOnly terlepas dari isEditing */}
            <div className="flex items-center rounded-xl px-4 py-3 opacity-70 cursor-not-allowed">
              <Mail className="w-5 h-5 text-slate-400 mr-3" />
              <input type="email" value={user?.email || ""} readOnly className="bg-transparent w-full outline-none text-foreground text-sm font-medium cursor-not-allowed" />
            </div>
            {isEditing && <p className="text-[10px] text-slate-500 mt-2">*Email terikat dengan identitas login dan tidak dapat diubah.</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Nomor Telepon / WhatsApp</label>
            <div className={`flex items-center rounded-xl px-4 py-3 transition-colors ${isEditing ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700' : 'bg-transparent border border-transparent'}`}>
              <Phone className={`w-5 h-5 mr-3 ${isEditing ? 'text-blue-500' : 'text-slate-400'}`} />
              <input 
                type="tel" name="phone_number" 
                value={profileForm.phone_number || (isEditing ? "" : "-")} 
                onChange={handleProfileChange} 
                placeholder="Contoh: 081234567890" 
                readOnly={!isEditing}
                className={`bg-transparent w-full outline-none text-sm font-medium ${!isEditing ? 'text-foreground cursor-default' : 'text-foreground'}`} 
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Alamat Pengiriman Utama</label>
            <div className={`flex items-start rounded-xl px-4 py-3 transition-colors ${isEditing ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700' : 'bg-transparent border border-transparent'}`}>
              <MapPin className={`w-5 h-5 mr-3 mt-0.5 ${isEditing ? 'text-blue-500' : 'text-slate-400'}`} />
              <textarea 
                rows={isEditing ? 3 : 1} 
                name="address" 
                value={profileForm.address || (isEditing ? "" : "-")} 
                onChange={handleProfileChange} 
                placeholder="Masukkan alamat lengkap" 
                readOnly={!isEditing}
                className={`bg-transparent w-full outline-none text-sm font-medium resize-none overflow-hidden ${!isEditing ? 'text-foreground cursor-default' : 'text-foreground'}`}
              ></textarea>
            </div>
          </div>

          {/* Tombol Simpan & Batal (Hanya muncul jika isEditing == true) */}
          {isEditing && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3 relative z-20 animate-in fade-in slide-in-from-bottom-2">
              <button 
                onClick={cancelEdit} 
                disabled={isSavingProfile} 
                className="px-6 py-3 rounded-full font-bold transition-all text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Batal
              </button>
              <button 
                onClick={onSaveClick} 
                disabled={isSavingProfile} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSavingProfile ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan Profil</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BAGIAN 2: KEAMANAN (GANTI PASSWORD) */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground mb-6">Keamanan Akun</h2>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Kata Sandi Baru</label>
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
              <KeyRound className="w-5 h-5 text-slate-400 mr-3" />
              <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} placeholder="Minimal 6 karakter" className="bg-transparent w-full outline-none text-foreground text-sm font-medium" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Konfirmasi Kata Sandi Baru</label>
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
              <ShieldCheck className="w-5 h-5 text-slate-400 mr-3" />
              <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} placeholder="Ulangi kata sandi baru" className="bg-transparent w-full outline-none text-foreground text-sm font-medium" />
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button onClick={handleUpdatePassword} disabled={isUpdatingPassword || !passwordForm.newPassword} className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white px-8 py-3 rounded-full font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2">
              {isUpdatingPassword ? <><Loader2 className="w-4 h-4 animate-spin" /> Memperbarui...</> : <><KeyRound className="w-4 h-4" /> Perbarui Sandi</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}