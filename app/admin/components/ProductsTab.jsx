import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, X, AlertTriangle, ChevronLeft, ChevronRight, Tags, FolderPlus 
} from 'lucide-react';
import { formatRupiah } from '../utils';
import { useToastStore } from '../../../store/toastStore';
import { deleteProduct } from '../../../lib/api';
import ProductFormModal from './ProductFormModal';

export default function ProductsTab({ products, isLoadingProducts, fetchProducts }) {
  const addToast = useToastStore((state) => state.addToast);
  
  // STATE UTAMA
  const [searchProductTerm, setSearchProductTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  
  // STATE MODAL FORM PRODUK
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingProduct, setEditingProduct] = useState(null);

  // STATE PAGINASI
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // STATE MANAJEMEN KATEGORI
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [manualCategories, setManualCategories] = useState(['T-Shirts', 'Hoodies', 'Pants', 'Accessories']);

  // FILTERING DATA PENCARIAN
  const filteredProducts = useMemo(() => {
    return products.filter(product => 
      product.name.toLowerCase().includes(searchProductTerm.toLowerCase()) || 
      product.id.toLowerCase().includes(searchProductTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchProductTerm.toLowerCase())
    );
  }, [products, searchProductTerm]);

  // RESET PAGINASI SAAT MENCARI
  useEffect(() => {
    setCurrentPage(1);
  }, [searchProductTerm]);

  // KALKULASI PAGINASI
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length);
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // MENGGABUNGKAN KATEGORI
  const allCategories = useMemo(() => {
    const dbCats = products.map(p => p.category).filter(Boolean);
    return [...new Set([...manualCategories, ...dbCats])].sort();
  }, [products, manualCategories]);

  // FUNGSI BUKA TUTUP MODAL PRODUK
  const handleOpenModal = (mode, product = null) => {
    setModalMode(mode);
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // FUNGSI MANAJEMEN KATEGORI
  const handleAddCategory = (e) => {
    e.preventDefault();
    const cleanCat = newCategoryName.trim();
    if (!cleanCat) return;

    const isExist = allCategories.some(c => c.toLowerCase() === cleanCat.toLowerCase());
    
    if (!isExist) {
      setManualCategories(prev => [...prev, cleanCat]);
      addToast(`Kategori "${cleanCat}" berhasil ditambahkan!`, 'success');
      setNewCategoryName("");
    } else {
      addToast('Kategori tersebut sudah ada di dalam daftar.', 'error');
    }
  };

  const handleRemoveCategory = (catToRemove) => {
    const isUsedInDB = products.some(p => p.category === catToRemove);
    if (isUsedInDB) {
      addToast(`Kategori "${catToRemove}" sedang digunakan oleh produk dan tidak bisa dihapus.`, 'error');
      return;
    }
    
    setManualCategories(prev => prev.filter(c => c !== catToRemove));
    addToast(`Kategori dihapus dari opsi.`, 'info');
  };

  // FUNGSI HAPUS PRODUK
  const confirmDelete = async () => {
    setIsProcessing(true);
    try {
      await deleteProduct(deleteModal.id);
      addToast(`Produk dihapus!`, 'success');
      
      if (currentProducts.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }

      setDeleteModal({ isOpen: false, id: null, name: '' });
      fetchProducts();
    } catch (err) {
      console.error(err);
      addToast('Gagal menghapus produk.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Navigasi Paginasi
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <div className="animate-in fade-in duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Katalog Produk</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Atur harga, kategori, gambar lokal, dan stok pakaian Anda.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsCategoryModalOpen(true)} 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-foreground px-5 py-2.5 rounded-full font-bold transition-all shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 active:scale-95 flex items-center gap-2"
          >
            <Tags className="w-4 h-4" /> Kelola Kategori
          </button>
          <button 
            onClick={() => handleOpenModal('add')} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Produk
          </button>
        </div>
      </header>
      
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden mb-8">
        
        {/* HEADER TABEL & SEARCH */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-foreground">Daftar Produk</h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Cari nama / ID / Kategori..." value={searchProductTerm} onChange={(e) => setSearchProductTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
          </div>
        </div>

        {/* TABEL DATA */}
        <div className="overflow-x-auto min-h-100">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-sm">
              <tr>
                <th className="px-6 py-4">Produk</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoadingProducts ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>Memuat data produk...</td></tr>
              ) : currentProducts.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">Tidak ada produk ditemukan.</td></tr>
              ) : (
                currentProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 group-hover:border-blue-200 dark:group-hover:border-slate-600 transition-colors">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground group-hover:text-blue-800 dark:group-hover:text-blue-400 transition-colors truncate max-w-50 sm:max-w-xs">{product.name}</p>
                          <p className="text-xs font-mono text-slate-500 group-hover:text-blue-500/70 dark:group-hover:text-blue-400/70 transition-colors mt-0.5">ID: {product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 text-foreground/70 group-hover:text-blue-600 dark:group-hover:text-blue-300 rounded-md text-xs font-bold transition-colors">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground group-hover:text-blue-800 dark:group-hover:text-blue-400 transition-colors">
                      {formatRupiah(product.price)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal('edit', product)} className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteModal({ isOpen: true, id: product.id, name: product.name })} className="p-2 text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER PAGINASI */}
        {!isLoadingProducts && filteredProducts.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800/20">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Menampilkan <span className="font-bold text-foreground">{startIndex + 1}</span> hingga <span className="font-bold text-foreground">{endIndex}</span> dari <span className="font-bold text-foreground">{filteredProducts.length}</span> data
            </p>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                {[...Array(totalPages)].map((_, idx) => {
                  const pageNumber = idx + 1;
                  if (totalPages > 5 && Math.abs(pageNumber - currentPage) > 1 && pageNumber !== 1 && pageNumber !== totalPages) {
                    if (Math.abs(pageNumber - currentPage) === 2) return <span key={pageNumber} className="text-slate-400">...</span>;
                    return null;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${currentPage === pageNumber ? 'bg-blue-600 text-white border border-blue-600 shadow-sm' : 'bg-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PEMANGGILAN KOMPONEN MODAL TERPISAH */}
      <ProductFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        initialProduct={editingProduct}
        allCategories={allCategories}
        onSuccess={fetchProducts}
      />

      {/* =========================================
          MODAL MANAJEMEN KATEGORI
      ========================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-130 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-600" /> Kelola Kategori
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-foreground/40 hover:text-foreground p-1"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={newCategoryName} 
                  onChange={(e) => setNewCategoryName(e.target.value)} 
                  placeholder="Ketik kategori baru..." 
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground"
                />
                <button type="submit" disabled={!newCategoryName.trim()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0">
                  Tambah
                </button>
              </form>

              <div>
                <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-3">Daftar Kategori Tersedia</p>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {allCategories.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Belum ada kategori.</p>
                  ) : (
                    allCategories.map(cat => {
                      const isUsedInDB = products.some(p => p.category === cat);
                      return (
                        <div key={cat} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium ${isUsedInDB ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-foreground' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-400'}`}>
                          {cat}
                          {!isUsedInDB && (
                            <button onClick={() => handleRemoveCategory(cat)} className="ml-1 text-blue-400 hover:text-red-500 transition-colors p-0.5 rounded-md hover:bg-white dark:hover:bg-slate-800" title="Hapus opsi ini">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">* Kategori berwarna biru bisa dihapus. Kategori abu-abu tidak bisa dihapus karena sedang dipakai oleh produk di dalam sistem.</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <button onClick={() => setIsCategoryModalOpen(false)} className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-foreground rounded-full font-bold transition-colors">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM DELETE */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-130 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8" /></div>
            <h3 className="text-xl font-bold text-foreground mb-2">Hapus Produk?</h3>
            <p className="text-foreground/60 text-sm mb-8">Anda yakin ingin menghapus <strong>{deleteModal.name}</strong> secara permanen?</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteModal({ isOpen: false, id: null, name: '' })} className="flex-1 py-3 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Batal</button>
              <button onClick={confirmDelete} disabled={isProcessing} className="flex-1 py-3 rounded-full font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-70">{isProcessing ? 'Menghapus...' : 'Ya, Hapus'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}