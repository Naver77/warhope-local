import React, { useState, useEffect } from "react";
import { User, MapPin, Mail, Phone, Save, Edit2, X, Lock, Key, Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useToastStore } from "../../store/toastStore";
import { useAuthStore } from "../../store/authStore";

export default function SettingsTab({ user }) {
  const addToast = useToastStore((state) => state.addToast);
  const updateUserProfile = useAuthStore((state) => state.updateUserProfile);

  // --- STATE PROFIL ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone_number: "",
    address: ""
  });

  // --- STATE PASSWORD ---
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState({ new: false, confirm: false });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  // Inisialisasi data profil saat user tersedia
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone_number: user.phone_number || "",
        address: user.address || ""
      });
    }
  }, [user]);

  // --- HANDLERS PROFIL ---
  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleCancelEdit = () => {
    // Kembalikan ke data semula jika batal
    setProfileForm({
      name: user.name || "",
      phone_number: user.phone_number || "",
      address: user.address || ""
    });
    setIsEditMode(false);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSavingProfile(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: profileForm.name,
          phone_number: profileForm.phone_number,
          address: profileForm.address
        })
        .eq("id", user.id);

      if (error) throw error;

      updateUserProfile({
        name: profileForm.name,
        phone_number: profileForm.phone_number,
        address: profileForm.address
      });

      addToast("Profil berhasil diperbarui!", "success");
      setIsEditMode(false);
    } catch (error) {
      console.error("Error update profil:", error);
      addToast("Gagal memperbarui profil.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- HANDLERS PASSWORD ---
  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword.length < 6) {
      addToast("Password baru minimal 6 karakter.", "warning");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast("Konfirmasi password tidak cocok.", "error");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // Supabase standard password update
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      addToast("Password berhasil diubah!", "success");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error update password:", error);
      addToast(error.message || "Gagal mengubah password.", "error");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      
      {/* KARTU 1: INFORMASI PRIBADI */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Informasi Pribadi
          </h2>
          {!isEditMode && (
            <button 
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Ubah Data
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Nama Lengkap</label>
            <div className={`flex items-center border rounded-xl px-4 py-3 transition-colors ${isEditMode ? "bg-white dark:bg-slate-900 border-blue-300 dark:border-blue-700 focus-within:ring-2 ring-blue-100" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"}`}>
              <User className="w-5 h-5 text-slate-400 mr-3" />
              <input type="text" name="name" value={profileForm.name} onChange={handleProfileChange} readOnly={!isEditMode} className={`bg-transparent w-full outline-none text-sm font-medium ${!isEditMode && "text-slate-600 dark:text-slate-400 cursor-default"}`} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Alamat Email <span className="text-red-500">*</span></label>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 opacity-80 cursor-not-allowed">
              <Mail className="w-5 h-5 text-slate-400 mr-3" />
              <input type="email" value={user.email || ""} readOnly className="bg-transparent w-full outline-none text-slate-600 dark:text-slate-400 text-sm font-medium cursor-not-allowed" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Nomor Telepon / WhatsApp</label>
            <div className={`flex items-center border rounded-xl px-4 py-3 transition-colors ${isEditMode ? "bg-white dark:bg-slate-900 border-blue-300 dark:border-blue-700 focus-within:ring-2 ring-blue-100" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"}`}>
              <Phone className="w-5 h-5 text-slate-400 mr-3" />
              <input type="tel" name="phone_number" value={profileForm.phone_number} onChange={handleProfileChange} readOnly={!isEditMode} placeholder={isEditMode ? "Contoh: 081234567890" : "Belum diatur"} className={`bg-transparent w-full outline-none text-sm font-medium ${!isEditMode && "text-slate-600 dark:text-slate-400 cursor-default"}`} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Alamat Pengiriman Utama</label>
            <div className={`flex items-start border rounded-xl px-4 py-3 transition-colors ${isEditMode ? "bg-white dark:bg-slate-900 border-blue-300 dark:border-blue-700 focus-within:ring-2 ring-blue-100" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"}`}>
              <MapPin className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
              <textarea rows={3} name="address" value={profileForm.address} onChange={handleProfileChange} readOnly={!isEditMode} placeholder={isEditMode ? "Masukkan alamat lengkap (Jalan, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos)" : "Belum diatur"} className={`bg-transparent w-full outline-none text-sm font-medium resize-none ${!isEditMode && "text-slate-600 dark:text-slate-400 cursor-default"}`}></textarea>
            </div>
          </div>

          {/* Tombol Aksi Muncul Hanya di Mode Edit */}
          {isEditMode && (
            <div className="pt-4 flex justify-end gap-3 animate-in fade-in slide-in-from-bottom-2">
              <button onClick={handleCancelEdit} disabled={isSavingProfile} className="px-6 py-2.5 rounded-full font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                <X className="w-4 h-4" /> Batal
              </button>
              <button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full font-bold transition-all shadow-md active:scale-95 disabled:opacity-70 flex items-center gap-2">
                {isSavingProfile ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KARTU 2: KEAMANAN AKUN (GANTI PASSWORD) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Keamanan Akun</h2>
            <p className="text-xs text-foreground/60">Perbarui kata sandi untuk menjaga keamanan akun Anda.</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Password Baru</label>
              <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus-within:ring-2 ring-blue-100 transition-all">
                <Key className="w-5 h-5 text-slate-400 mr-3" />
                <input 
                  type={showPassword.new ? "text" : "password"} 
                  name="newPassword" 
                  value={passwordForm.newPassword} 
                  onChange={handlePasswordChange} 
                  placeholder="Minimal 6 karakter" 
                  className="bg-transparent w-full outline-none text-foreground text-sm font-medium" 
                />
                <button type="button" onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })} className="text-slate-400 hover:text-slate-600">
                  {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Konfirmasi Password</label>
              <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus-within:ring-2 ring-blue-100 transition-all">
                <Lock className="w-5 h-5 text-slate-400 mr-3" />
                <input 
                  type={showPassword.confirm ? "text" : "password"} 
                  name="confirmPassword" 
                  value={passwordForm.confirmPassword} 
                  onChange={handlePasswordChange} 
                  placeholder="Ulangi password baru" 
                  className="bg-transparent w-full outline-none text-foreground text-sm font-medium" 
                />
                <button type="button" onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })} className="text-slate-400 hover:text-slate-600">
                  {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button 
              type="submit" 
              disabled={isUpdatingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword} 
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-8 py-2.5 rounded-full font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              {isUpdatingPassword ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Memproses...</> : "Ubah Password"}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}