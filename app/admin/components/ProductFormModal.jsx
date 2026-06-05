import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, AlertCircle, UploadCloud, Image as ImageIcon, ChevronDown } from 'lucide-react';
import imageCompression from 'browser-image-compression'; // DITAMBAHKAN: Library Kompresi
import { useToastStore } from '../../../store/toastStore';
import { supabase } from '../../../lib/supabase';
import { addProduct, updateProduct } from '../../../lib/api';

const defaultSizes = {
  S: { active: false, stock: 0 },
  M: { active: false, stock: 0 },
  L: { active: false, stock: 0 },
  XL: { active: false, stock: 0 },
  XXL: { active: false, stock: 0 },
  "All Size": { active: false, stock: 0 },
};

const initialForm = { 
  id: '', 
  name: '', 
  category: '', 
  price: '', 
  weight: '500', 
  description: '', 
  image: '', 
  sizes: JSON.parse(JSON.stringify(defaultSizes)) 
};

export default function ProductFormModal({ isOpen, onClose, mode, initialProduct, allCategories, onSuccess }) {
  const addToast = useToastStore((state) => state.addToast);
  
  const [formData, setFormData] = useState(initialForm);
  const [originalData, setOriginalData] = useState(initialForm);
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);

  useEffect(() => {
    setIsProcessing(false); 

    if (isOpen) {
      let targetData = JSON.parse(JSON.stringify(initialForm));
      
      if (mode === 'edit' && initialProduct) {
        let parsedSizes = JSON.parse(JSON.stringify(defaultSizes));
        let productSizes = initialProduct.sizes;

        if (typeof productSizes === 'string') {
          try { productSizes = JSON.parse(productSizes); } catch {}
        }

        if (Array.isArray(productSizes)) {
          productSizes.forEach(s => { if(parsedSizes[s]) parsedSizes[s] = { active: true, stock: 10 } });
        } else if (typeof productSizes === 'object' && productSizes !== null) {
          parsedSizes = { ...parsedSizes, ...productSizes };
        }

        targetData = { 
          ...initialProduct, 
          sizes: parsedSizes,
          weight: initialProduct.weight?.toString() || '500'
        };
        setImagePreview(initialProduct.image);
      } else if (mode === 'add') {
        // Set kategori default jika tersedia
        targetData.category = allCategories[0] || '';
      }
      
      setFormData(targetData);
      setOriginalData(targetData);
    } else {
      setFormData(JSON.parse(JSON.stringify(initialForm)));
      setOriginalData(JSON.parse(JSON.stringify(initialForm)));
      setImageFile(null);
      setImagePreview(null);
      setDiscardModalOpen(false);
    }
  }, [isOpen, mode, initialProduct, allCategories]);

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalData) || imageFile !== null;
  }, [formData, originalData, imageFile]);

  useEffect(() => {
    if (isOpen && mode === 'add' && formData.category && formData.category.length >= 3) {
      if (!formData.id || formData.id === originalData.id) {
        const prefix = formData.category.substring(0, 3).toUpperCase();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setFormData(prev => ({ ...prev, id: `${prefix}-${randomNum}` }));
      }
    }
  }, [formData.category, mode, isOpen, originalData.id, formData.id]);

  const forceCloseModal = () => onClose();

  const handleRequestClose = () => {
    if (isDirty) setDiscardModalOpen(true);
    else forceCloseModal();
  };

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePriceChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, price: rawValue }));
  };

  const formatPriceDisplay = (val) => {
    if (!val) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // DITINGKATKAN: Batas naik ke 5MB agar foto kamera HP bisa masuk, toh nanti dikompres
    if (file.size > 5 * 1024 * 1024) { addToast('Ukuran file terlalu besar! Maksimal 5MB.', 'error'); return; }
    if (!file.type.startsWith('image/')) { addToast('Format file tidak didukung! Gunakan gambar.', 'error'); return; }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file)); 
  };

  const toggleSize = (sizeKey) => {
    setFormData(prev => ({
      ...prev,
      sizes: {
        ...prev.sizes,
        [sizeKey]: { ...prev.sizes[sizeKey], active: !prev.sizes[sizeKey].active, stock: prev.sizes[sizeKey].active ? 0 : 10 } 
      }
    }));
  };

  const updateStock = (sizeKey, newStock) => {
    const stockVal = Math.max(0, parseInt(newStock) || 0);
    setFormData(prev => ({
      ...prev,
      sizes: {
        ...prev.sizes,
        [sizeKey]: { ...prev.sizes[sizeKey], stock: stockVal }
      }
    }));
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const hasActiveSize = Object.values(formData.sizes).some(s => s.active);
      if (!hasActiveSize) {
        addToast('Minimal aktifkan 1 ukuran produk.', 'error');
        setIsProcessing(false); return;
      }
      if (!formData.category) {
        addToast('Anda harus memilih kategori produk.', 'error');
        setIsProcessing(false); return;
      }

      let finalImageUrl = formData.image;

      // LOGIKA UPLOAD GAMBAR DENGAN KOMPRESI WEBP
      if (imageFile) {
        addToast('Mengompres dan mengunggah gambar...', 'info');
        
        // 1. Opsi Kompresi Tingkat Lanjut
        const options = {
          maxSizeMB: 0.3, // Paksa maksimal 300KB
          maxWidthOrHeight: 1080, // Resolusi ideal E-Commerce
          useWebWorker: true,
          fileType: 'image/webp' // Konversi otomatis ke WebP
        };

        // 2. Eksekusi Kompresi
        const compressedBlob = await imageCompression(imageFile, options);

        // 3. Penamaan File WebP
        const fileName = `${formData.id}-${Date.now()}.webp`;
        
        // 4. Upload File yang sudah dikompres ke Supabase
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, compressedBlob, { 
            contentType: 'image/webp',
            cacheControl: '3600', 
            upsert: false 
          });

        if (uploadError) throw new Error(`Gagal upload gambar: ${uploadError.message}`);

        // 5. Ambil URL Publik
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
        finalImageUrl = publicUrl;
      }

      const totalGlobalStock = Object.values(formData.sizes).reduce((acc, curr) => {
        return acc + (curr.active ? parseInt(curr.stock || 0) : 0);
      }, 0);

      const needsStringifiedSizes = initialProduct && typeof initialProduct.sizes === 'string';

      const payload = {
        id: formData.id,
        name: formData.name,
        category: formData.category,
        price: parseInt(formData.price || 0),
        weight: parseInt(formData.weight || 500),
        stock: totalGlobalStock,
        description: formData.description,
        image: finalImageUrl, 
        sizes: needsStringifiedSizes ? JSON.stringify(formData.sizes) : formData.sizes,
      };

      if (mode === 'add') {
        await addProduct(payload);
        addToast(`Produk ditambahkan!`, 'success');
      } else {
        await updateProduct(payload.id, payload);
        addToast(`Produk diperbarui!`, 'success');
      }
      
      forceCloseModal(); 
      setIsProcessing(false); 
      onSuccess(); 

    } catch (err) {
      console.error(err);
      addToast(err.message || 'Gagal menyimpan produk.', 'error');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-140 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        <div className="relative z-20 flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0 shadow-sm">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            {mode === 'add' ? 'Tambah Produk Baru' : 'Edit Produk'}
            {isDirty && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-md uppercase tracking-widest ml-2">Draft</span>}
          </h3>
          <button onClick={handleRequestClose} className="text-foreground/40 hover:text-foreground p-1 transition-colors"><X className="w-6 h-6" /></button>
        </div>
        
        <form onSubmit={handleSubmitProduct} className="flex flex-col flex-1 overflow-hidden bg-slate-50/50 dark:bg-slate-800/20">
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              <div className="md:col-span-4 space-y-4">
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Foto Produk</label>
                <div className="relative group w-full aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 transition-all shadow-sm">
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-4 flex flex-col items-center">
                      <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3 group-hover:text-blue-500 transition-colors" />
                      <p className="text-sm font-bold text-foreground">Klik untuk Upload</p>
                      <p className="text-[10px] text-slate-500 mt-1">Otomatis WebP (Max 5MB)</p>
                    </div>
                  )}
                  {imagePreview && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <UploadCloud className="w-8 h-8 text-white mb-2" />
                      <span className="text-xs font-bold text-white uppercase tracking-widest">Ganti Foto</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" required={mode === 'add' && !formData.image} />
                </div>
              </div>

              <div className="md:col-span-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest flex items-center justify-between">Kategori</label>
                    <div className="relative">
                      <select required name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground appearance-none cursor-pointer shadow-sm">
                        <option value="" disabled>Pilih Kategori Produk...</option>
                        {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest flex items-center justify-between">
                      ID Produk <span className="text-[9px] text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full lowercase border border-amber-200 dark:border-amber-800">Otomatis</span>
                    </label>
                    <input required name="id" value={formData.id} readOnly className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-foreground/50 cursor-not-allowed font-mono shadow-sm" />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Nama Produk</label>
                    <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground shadow-sm" placeholder="Contoh: Heavyweight Boxy T-Shirt" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Harga Satuan (Rp)</label>
                    <input required type="text" inputMode="numeric" name="price" value={formatPriceDisplay(formData.price)} onChange={handlePriceChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground shadow-sm font-medium tracking-wide" placeholder="249.000" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Berat (Gram)</label>
                    <input required type="number" min="1" name="weight" value={formData.weight} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground shadow-sm font-medium tracking-wide" placeholder="500" />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Deskripsi</label>
                    <textarea required name="description" rows={4} value={formData.description} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground resize-none shadow-sm leading-relaxed" placeholder="Tuliskan spesifikasi, material, atau keunikan produk..."></textarea>
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-slate-800" />

                <div>
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest mb-4 flex items-center justify-between">
                    Manajemen Varian & Stok Fisik
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md lowercase tracking-normal">Stok global akan otomatis dijumlahkan.</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.keys(formData.sizes).map(size => {
                      const isActive = formData.sizes[size].active;
                      return (
                        <div key={size} className={`flex items-center justify-between p-3 rounded-xl border transition-all shadow-sm ${isActive ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                          <button type="button" onClick={() => toggleSize(size)} className={`w-16 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-colors shadow-sm ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-foreground'}`}>
                            {size}
                          </button>
                          {isActive ? (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                              <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300">Stok:</span>
                              <input type="number" min="0" value={formData.sizes[size].stock} onChange={(e) => updateStock(size, e.target.value)} className="w-20 bg-white dark:bg-slate-950 border border-blue-200 dark:border-blue-800 rounded-lg px-2 py-2 text-sm text-center font-bold focus:ring-2 focus:ring-blue-600 outline-none text-foreground" />
                            </div>
                          ) : (
                            <span className="text-[10px] uppercase font-bold text-slate-400 mr-4">Nonaktif</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="relative z-20 p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0 flex justify-end gap-3 rounded-b-3xl">
            <button type="button" onClick={handleRequestClose} disabled={isProcessing} className="px-6 py-3 rounded-full font-bold text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Batal</button>
            <button type="submit" disabled={isProcessing || !isDirty} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2">
              {isProcessing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan Produk</>}
            </button>
          </div>
        </form>
      </div>

      {discardModalOpen && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8" /></div>
            <h3 className="text-xl font-bold text-foreground mb-2">Batalkan Perubahan?</h3>
            <p className="text-foreground/60 text-sm mb-8">Anda memiliki data yang belum disimpan. Perubahan ini akan hilang jika Anda keluar.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDiscardModalOpen(false)} className="flex-1 py-3 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Kembali Edit</button>
              <button onClick={forceCloseModal} className="flex-1 py-3 rounded-full font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors">Ya, Buang</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}