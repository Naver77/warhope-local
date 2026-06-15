"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, AlertCircle, UploadCloud, Image as ImageIcon, ChevronDown, Percent, Tag, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { useToastStore } from '../../../store/toastStore';
import { supabase } from '../../../lib/supabase';
import { addProduct, updateProduct } from '../../../lib/api';

const getInitialForm = () => ({ 
  id: '', name: '', category: '', price: '', discount: 0, weight: '500', description: '', image: '', sizes: {} 
});

export default function ProductFormModal({ isOpen, onClose, mode, initialProduct, allCategories, masterSizes, onSuccess }) {
  const addToast = useToastStore((state) => state.addToast);
  
  const [formData, setFormData] = useState(getInitialForm());
  const [originalData, setOriginalData] = useState(getInitialForm());
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [processStep, setProcessStep] = useState(''); 
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  
  const isProcessing = processStep !== '';

  useEffect(() => {
    setProcessStep(''); 

    const prepareModalData = async () => {
      if (!isOpen) {
        setFormData(getInitialForm());
        setOriginalData(getInitialForm());
        setImageFile(null);
        setImagePreview(null);
        setDiscardModalOpen(false);
        return;
      }

      // ✅ 1. SISTEM PENYELAMAT UKURAN: Jika SWR gagal/lambat, gunakan fallback S-XXL
      const safeMasterSizes = masterSizes?.length > 0 ? masterSizes : ['S', 'M', 'L', 'XL', 'XXL'];
      const dynamicBaseSizes = {};
      safeMasterSizes.forEach(sizeName => {
        dynamicBaseSizes[sizeName] = { active: false, stock: 0 };
      });

      let targetData = getInitialForm();
      targetData.sizes = { ...dynamicBaseSizes };
      
      if (mode === 'edit' && initialProduct?.id) {
        let dbProduct = { ...initialProduct };

        let productSizes = dbProduct.sizes;

        if (typeof productSizes === 'string') {
          try { productSizes = JSON.parse(productSizes); } catch {}
        }

        if (typeof productSizes === 'object' && productSizes !== null && !Array.isArray(productSizes)) {
           Object.keys(productSizes).forEach(key => {
             const matchedKey = safeMasterSizes.find(s => s.toLowerCase() === key.toLowerCase());
             if (matchedKey) {
               dynamicBaseSizes[matchedKey] = {
                 active: productSizes[key].active || false,
                 stock: parseInt(productSizes[key].stock) || 0
               }
             }
           });
        }

        targetData = { 
          ...dbProduct, 
          sizes: dynamicBaseSizes,
          weight: dbProduct.weight?.toString() || '500',
          discount: parseInt(dbProduct.discount) || 0,
          description: dbProduct.description || '' 
        };
        setImagePreview(dbProduct.image);
      } else if (mode === 'add') {
        targetData.category = allCategories[0] || '';
      }
      
      setFormData(targetData);
      setOriginalData(targetData);
    };

    prepareModalData();
  }, [isOpen, mode, initialProduct, allCategories, masterSizes]);

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalData) || imageFile !== null;
  }, [formData, originalData, imageFile]);

  const calculatedFinalPrice = useMemo(() => {
    const basePrice = parseInt(formData.price) || 0;
    const disc = parseInt(formData.discount) || 0;
    return basePrice - (basePrice * (disc / 100));
  }, [formData.price, formData.discount]);

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

  const handleDiscountChange = (e) => {
    let val = parseInt(e.target.value.replace(/\D/g, '') || 0);
    if (val > 100) val = 100;
    setFormData(prev => ({ ...prev, discount: val }));
  };

  const formatPriceDisplay = (val) => {
    if (!val) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) { 
      addToast('Ukuran file terlalu besar! Maksimal 2MB.', 'error'); 
      return; 
    }
    
    if (!file.type.startsWith('image/')) { 
      addToast('Format file tidak didukung! Gunakan gambar.', 'error'); 
      return; 
    }

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
    
    try {
      const hasActiveSize = Object.values(formData.sizes).some(s => s.active);
      if (!hasActiveSize) {
        addToast('Minimal aktifkan 1 ukuran produk.', 'error');
        return;
      }
      if (!formData.category) {
        addToast('Anda harus memilih kategori produk.', 'error');
        return;
      }

      let finalImageUrl = formData.image;

      if (imageFile) {
        setProcessStep('compress'); 
        
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1000,
          useWebWorker: true,
          fileType: 'image/webp',
          initialQuality: 0.8,
          alwaysKeepResolution: false 
        };

        const compressedBlob = await imageCompression(imageFile, options);
        
        setProcessStep('upload'); 
        const fileName = `${formData.id}-${Date.now()}.webp`;
        
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, compressedBlob, { 
            contentType: 'image/webp',
            cacheControl: '31536000',
            upsert: false
          });

        if (uploadError) throw new Error(`Gagal upload gambar: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
        finalImageUrl = publicUrl;
      }

      setProcessStep('save'); 

      const totalGlobalStock = Object.values(formData.sizes).reduce((acc, curr) => {
        return acc + (curr.active ? parseInt(curr.stock || 0) : 0);
      }, 0);

      const needsStringifiedSizes = initialProduct && typeof initialProduct.sizes === 'string';

      const payload = {
        id: formData.id,
        name: formData.name,
        category: formData.category,
        price: parseInt(formData.price) || 0,
        discount: parseInt(formData.discount) || 0,
        weight: parseInt(formData.weight) || 500,
        stock: totalGlobalStock,
        description: formData.description,
        image: finalImageUrl, 
        sizes: needsStringifiedSizes ? JSON.stringify(formData.sizes) : formData.sizes,
      };

      let savedData = null; 

      if (mode === 'add') {
        const res = await addProduct(payload);
        savedData = res[0]; 
        addToast(`Produk ditambahkan!`, 'success');
      } else {
        const res = await updateProduct(payload.id, payload);
        savedData = res[0];
        addToast(`Produk diperbarui!`, 'success');
      }
      
      forceCloseModal(); 
      setProcessStep(''); 
      onSuccess(savedData, mode); 

    } catch (err) {
      console.error(err);
      addToast(err.message || 'Gagal menyimpan produk.', 'error');
      setProcessStep('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-140 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] relative">

        {/* Header Modal */}
        <div className="relative z-20 flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0 shadow-sm">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            {mode === 'add' ? 'Tambah Produk Baru' : 'Edit Produk'}
            {isDirty && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-md uppercase tracking-widest ml-2">Draft</span>}
          </h3>
          <button onClick={handleRequestClose} disabled={isProcessing} className="text-foreground/40 hover:text-foreground p-1 transition-colors disabled:opacity-50"><X className="w-6 h-6" /></button>
        </div>
        
        {/* Form Body */}
        <form onSubmit={handleSubmitProduct} className="flex flex-col flex-1 overflow-hidden bg-slate-50/50 dark:bg-slate-800/20">
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Kolom Gambar */}
              <div className="md:col-span-4 space-y-4">
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest block mb-2">Foto Produk</label>
                <div className={`relative group w-full aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex flex-col items-center justify-center text-center transition-all shadow-sm ${isProcessing ? 'opacity-70 pointer-events-none' : 'cursor-pointer hover:border-blue-500'}`}>
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-4 flex flex-col items-center">
                      <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3 group-hover:text-blue-500 transition-colors" />
                      <p className="text-sm font-bold text-foreground">Klik untuk Upload</p>
                      <p className="text-[10px] text-slate-500 mt-1">Otomatis WebP (Max 2MB)</p>
                    </div>
                  )}
                  {imagePreview && !isProcessing && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <UploadCloud className="w-8 h-8 text-white mb-2" />
                      <span className="text-xs font-bold text-white uppercase tracking-widest">Ganti Foto</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} disabled={isProcessing} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" required={mode === 'add' && !formData.image} />
                </div>
              </div>

              {/* Kolom Input Text */}
              <div className="md:col-span-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest flex items-center justify-between">Kategori</label>
                    <div className="relative">
                      <select required name="category" value={formData.category} disabled={isProcessing} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground appearance-none cursor-pointer shadow-sm disabled:opacity-70">
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
                    <input required name="name" value={formData.name} disabled={isProcessing} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground shadow-sm disabled:opacity-70" placeholder="Contoh: Heavyweight Boxy T-Shirt" />
                  </div>

                  <div className="sm:col-span-2 bg-slate-100/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest flex items-center gap-1">
                          <Tag className="w-3 h-3" /> Harga Asli (Rp)
                        </label>
                        <input required type="text" inputMode="numeric" name="price" value={formatPriceDisplay(formData.price)} disabled={isProcessing} onChange={handlePriceChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground shadow-sm font-medium tracking-wide disabled:opacity-70" placeholder="249.000" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1 dark:text-amber-500">
                          <Percent className="w-3 h-3" /> Diskon (%)
                        </label>
                        <input type="text" inputMode="numeric" name="discount" value={formData.discount || ''} disabled={isProcessing} onChange={handleDiscountChange} className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none text-amber-600 dark:text-amber-500 shadow-sm font-bold tracking-wide disabled:opacity-70" placeholder="0" />
                      </div>
                    </div>
                    
                    {formData.discount > 0 && (
                      <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Harga Akhir:</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          Rp {formatPriceDisplay(calculatedFinalPrice)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Berat (Gram)</label>
                    <input required type="number" min="1" name="weight" value={formData.weight} disabled={isProcessing} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground shadow-sm font-medium tracking-wide disabled:opacity-70" placeholder="500" />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Deskripsi</label>
                    <textarea required name="description" rows={4} value={formData.description} disabled={isProcessing} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground resize-none shadow-sm leading-relaxed disabled:opacity-70" placeholder="Tuliskan spesifikasi, material, atau keunikan produk..."></textarea>
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-slate-800" />

                <div>
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest mb-4 flex items-center justify-between">
                    Manajemen Varian & Stok Fisik
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md lowercase tracking-normal text-[10px] sm:text-xs">Stok global otomatis dijumlahkan.</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.keys(formData.sizes).map(size => {
                      const isActive = formData.sizes[size].active;
                      return (
                        <div key={size} className={`flex items-center justify-between p-3 rounded-xl border transition-all shadow-sm ${isActive ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'} ${isProcessing ? 'opacity-70' : ''}`}>
                          <button type="button" disabled={isProcessing} onClick={() => toggleSize(size)} className={`w-16 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-colors shadow-sm disabled:cursor-not-allowed ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-foreground'}`}>
                            {size}
                          </button>
                          {isActive ? (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                              <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300">Stok:</span>
                              <input type="number" min="0" disabled={isProcessing} value={formData.sizes[size].stock} onChange={(e) => updateStock(size, e.target.value)} className="w-20 bg-white dark:bg-slate-950 border border-blue-200 dark:border-blue-800 rounded-lg px-2 py-2 text-sm text-center font-bold focus:ring-2 focus:ring-blue-600 outline-none text-foreground disabled:opacity-70" />
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
            <button type="button" onClick={handleRequestClose} disabled={isProcessing} className="px-6 py-3 rounded-full font-bold text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">Batal</button>
            
            <button type="submit" disabled={isProcessing || !isDirty} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2 min-w-50 justify-center">
              {processStep === 'compress' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Mengompres...</>
              ) : processStep === 'upload' ? (
                <><UploadCloud className="w-4 h-4 animate-bounce" /> Mengunggah...</>
              ) : processStep === 'save' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
              ) : (
                <><Save className="w-4 h-4" /> Simpan Produk</>
              )}
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
              <button type="button" onClick={() => setDiscardModalOpen(false)} className="flex-1 py-3 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Kembali Edit</button>
              <button type="button" onClick={forceCloseModal} className="flex-1 py-3 rounded-full font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors">Ya, Buang</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}