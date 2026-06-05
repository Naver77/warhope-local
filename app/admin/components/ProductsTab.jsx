"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, AlertTriangle, 
  ChevronLeft, ChevronRight, Tags, Filter, ChevronDown 
} from 'lucide-react';
import { formatRupiah } from '../utils';
import { useToastStore } from '../../../store/toastStore';
import { deleteProduct, getCategories } from '../../../lib/api';
import ProductFormModal from './ProductFormModal';
import CategoryManagerModal from './CategoryManagerModal';

export default function ProductsTab({ products, isLoadingProducts, fetchProducts }) {
  const addToast = useToastStore((state) => state.addToast);
  
  // State Pencarian, Filter & Paging
  const [searchProductTerm, setSearchProductTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingProduct, setEditingProduct] = useState(null);

  // State Modal Kategori Baru
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  // State untuk Dropdown Filter & Form (Ditarik secara independen)
  const [dbCategories, setDbCategories] = useState([]);

  const fetchDBCategories = async () => {
    const cats = await getCategories();
    setDbCategories(cats);
  };

  useEffect(() => {
    fetchDBCategories();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchProductTerm.toLowerCase()) || 
        product.id.toLowerCase().includes(searchProductTerm.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === "All" || 
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchProductTerm, selectedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchProductTerm, selectedCategory]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length);
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Menggabungkan kategori dari DB dan kategori produk (untuk opsi form)
  const allCategories = useMemo(() => {
    const productCats = products.map(p => p.category).filter(Boolean);
    return [...new Set([...dbCategories, ...productCats])].sort();
  }, [products, dbCategories]);

  const handleOpenModal = (mode, product = null) => {
    setModalMode(mode);
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const confirmDelete = async () => {
    setIsProcessing(true);
    try {
      await deleteProduct(deleteModal.id);
      addToast(`Produk dihapus!`, 'success');
      if (currentProducts.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
      setDeleteModal({ isOpen: false, id: null, name: '' });
      fetchProducts();
    } catch (err) {
      console.error(err);
      addToast('Gagal menghapus produk.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Katalog Produk</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Atur harga, kategori, gambar lokal, dan stok pakaian Anda.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setIsCategoryModalOpen(true)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-foreground px-5 py-2.5 rounded-full font-bold transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2">
            <Tags className="w-4 h-4" /> Kelola Kategori
          </button>
          <button onClick={() => handleOpenModal('add')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Produk
          </button>
        </div>
      </header>
      
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-foreground shrink-0">Daftar Produk</h3>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground appearance-none cursor-pointer font-medium"
              >
                <option value="All">Semua Kategori</option>
                {dbCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Cari nama atau ID produk..." value={searchProductTerm} onChange={(e) => setSearchProductTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto min-h-100">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-sm">
              <tr>
                <th className="px-6 py-4">Produk</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4 text-center">Total Stok</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoadingProducts ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>Memuat data produk...</td></tr>
              ) : currentProducts.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-slate-500 text-center italic">Tidak ada produk yang cocok dengan kriteria.</td></tr>
              ) : (
                currentProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground truncate max-w-50 sm:max-w-xs">{product.name}</p>
                          <p className="text-xs font-mono text-slate-500 mt-0.5">ID: {product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="inline-flex px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-bold">{product.category}</span></td>
                    <td className="px-6 py-4 font-bold text-foreground">{formatRupiah(product.price)}</td>
                    <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-md text-xs font-bold ${product.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{product.stock || 0}</span></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal('edit', product)} className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 rounded-lg" title="Edit Produk"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteModal({ isOpen: true, id: product.id, name: product.name })} className="p-2 text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded-lg" title="Hapus Produk"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoadingProducts && filteredProducts.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800/20">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Menampilkan <span className="font-bold text-foreground">{startIndex + 1}</span> hingga <span className="font-bold text-foreground">{endIndex}</span> dari <span className="font-bold text-foreground">{filteredProducts.length}</span> data
            </p>
            <div className="flex items-center gap-2">
              <button onClick={goToPrevPage} disabled={currentPage === 1} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <div className="flex items-center gap-1 mx-2">
                {[...Array(totalPages)].map((_, idx) => {
                  const pageNumber = idx + 1;
                  if (totalPages > 5 && Math.abs(pageNumber - currentPage) > 1 && pageNumber !== 1 && pageNumber !== totalPages) {
                    if (Math.abs(pageNumber - currentPage) === 2) return <span key={pageNumber} className="text-slate-400">...</span>;
                    return null;
                  }
                  return (
                    <button key={pageNumber} onClick={() => setCurrentPage(pageNumber)} className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${currentPage === pageNumber ? 'bg-blue-600 text-white border border-blue-600 shadow-sm' : 'bg-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
              <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* PEMANGGILAN KOMPONEN MODAL DARI FILE EKSTERNAL */}
      <ProductFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        initialProduct={editingProduct}
        allCategories={allCategories}
        onSuccess={fetchProducts}
      />

      <CategoryManagerModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        products={products}
        onCategoryUpdated={fetchDBCategories}
      />

      {/* MODAL HAPUS PRODUK */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-130 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8" /></div>
            <h3 className="text-xl font-bold mb-2">Hapus Produk?</h3>
            <p className="text-foreground/60 text-sm mb-8">Anda yakin ingin menghapus <strong>{deleteModal.name}</strong> secara permanen?</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteModal({ isOpen: false, id: null, name: '' })} className="flex-1 py-3 rounded-full font-bold bg-slate-100">Batal</button>
              <button onClick={confirmDelete} disabled={isProcessing} className="flex-1 py-3 rounded-full font-bold bg-red-600 text-white">{isProcessing ? 'Menghapus...' : 'Ya, Hapus'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}