import React, { useState, useEffect, useMemo } from 'react';
import { X, FolderPlus, Tag, Trash2, AlertCircle } from 'lucide-react';
import { useToastStore } from '../../../store/toastStore';
import { getCategories, addCategory, deleteCategoryByName } from '../../../lib/api';

export default function CategoryManagerModal({ isOpen, onClose, products, onCategoryUpdated }) {
  const addToast = useToastStore((state) => state.addToast);
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [dbCategories, setDbCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDBCategories();
      setNewCategoryName("");
      setIsProcessing(false);
    }
  }, [isOpen]);

  const fetchDBCategories = async () => {
    setIsLoadingCategories(true);
    const cats = await getCategories();
    setDbCategories(cats);
    setIsLoadingCategories(false);
  };

  // Menggabungkan kategori dari DB dengan kategori "gaib" yang sudah terlanjur dipakai produk
  const allCategories = useMemo(() => {
    const productCats = products.map(p => p.category).filter(Boolean);
    return [...new Set([...dbCategories, ...productCats])].sort(
      (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [products, dbCategories]);

  // Fungsi utilitas untuk menghitung berapa produk yang pakai kategori ini
  const getUsageCount = (catName) => {
    return products.filter(p => p.category?.toLowerCase() === catName.toLowerCase()).length;
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const cleanCat = newCategoryName.trim();
    if (!cleanCat) return;

    if (allCategories.some(c => c.toLowerCase() === cleanCat.toLowerCase())) {
      addToast('Kategori tersebut sudah ada di daftar.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      await addCategory(cleanCat);
      addToast(`Kategori "${cleanCat}" berhasil ditambahkan!`, 'success');
      setNewCategoryName("");
      
      // Optimistic UI: Tambahkan ke layar langsung tanpa nunggu database refresh
      setDbCategories(prev => [...prev, cleanCat]);
      if (onCategoryUpdated) onCategoryUpdated();
    } catch (err) {
      console.error(err);
      addToast('Gagal menambahkan kategori.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveCategory = async (catToRemove) => {
    const usage = getUsageCount(catToRemove);
    if (usage > 0) {
      addToast(`Gagal! Kategori "${catToRemove}" sedang dipakai oleh ${usage} produk.`, 'error');
      return;
    }
    
    setIsProcessing(true);
    try {
      await deleteCategoryByName(catToRemove);
      addToast(`Kategori dihapus dari sistem.`, 'info');
      
      // Optimistic UI: Hapus dari layar langsung
      setDbCategories(prev => prev.filter(c => c !== catToRemove));
      if (onCategoryUpdated) onCategoryUpdated();
    } catch (err) {
      console.error(err);
      addToast('Gagal menghapus kategori.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-130 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shrink-0">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-blue-600" /> Kelola Kategori
          </h3>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-6 shrink-0">
            <input 
              type="text" 
              value={newCategoryName} 
              onChange={(e) => setNewCategoryName(e.target.value)} 
              placeholder="Ketik nama kategori baru..." 
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none text-foreground focus:ring-2 focus:ring-blue-600 transition-all shadow-sm" 
            />
            <button 
              type="submit" 
              disabled={!newCategoryName.trim() || isProcessing} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-md disabled:opacity-50 transition-all active:scale-95 whitespace-nowrap"
            >
              {isProcessing ? 'Memproses...' : 'Tambah Data'}
            </button>
          </form>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-3 shrink-0 flex items-center justify-between">
              Daftar Kategori 
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md text-[10px]">
                Total: {allCategories.length}
              </span>
            </p>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
              {isLoadingCategories ? (
                <div className="flex flex-col items-center justify-center h-32 text-sm text-slate-500 italic gap-3">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Memuat data...
                </div>
              ) : allCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-sm text-slate-500 italic">
                  Belum ada kategori di sistem.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allCategories.map(cat => {
                    const usageCount = getUsageCount(cat);
                    const isUsed = usageCount > 0;
                    const isMissingFromDB = !dbCategories.includes(cat) && isUsed;

                    return (
                      <div key={cat} className="flex items-center justify-between p-4 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-sm flex items-center gap-2">
                            <Tag className="w-3 h-3 text-slate-400" /> {cat}
                            {isMissingFromDB && (
                              <span title="Kategori ini dipakai di produk tapi tidak terdaftar resmi di database" className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold flex items-center gap-1">
                                <AlertCircle className="w-2 h-2" /> Unregistered
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {isUsed ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">
                              Dipakai {usageCount} Produk
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-md">
                              Kosong
                            </span>
                          )}
                          
                          <button 
                            onClick={() => handleRemoveCategory(cat)} 
                            disabled={isProcessing || isUsed} 
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                            title={isUsed ? "Tidak bisa dihapus karena sedang dipakai" : "Hapus Kategori"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shrink-0 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-foreground rounded-full font-bold transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}