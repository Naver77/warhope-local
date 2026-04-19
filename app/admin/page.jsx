"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Package, ShoppingCart, Plus, Edit, Trash2, 
  Search, ArrowLeft, X, Save, AlertTriangle, LogOut
} from 'lucide-react';
import { getAllProducts, addProduct, updateProduct, deleteProduct } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isInitialized, checkAuth, logout } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  const initialForm = { id: '', name: '', category: 'T-Shirts', price: '', description: '', image: '', colors: '', sizes: '' };
  const [formData, setFormData] = useState(initialForm);

  // Proteksi Rute: Hanya Admin yang boleh masuk
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        addToast('Silakan login terlebih dahulu.', 'info');
        router.push('/auth/login');
      } else if (user.role !== 'admin') {
        addToast('Akses ditolak! Anda bukan Admin.', 'error');
        router.push('/');
      } else {
        fetchProducts(); // Tarik data jika lolos sebagai admin
      }
    }
  }, [isInitialized, user, router, addToast]);

  const fetchProducts = async () => {
    setIsLoading(true);
    const data = await getAllProducts();
    setProducts(data || []);
    setIsLoading(false);
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    addToast('Anda telah keluar dari panel admin.', 'info');
    router.push('/auth/login');
  };

  // --- CRUD HANDLERS (Sama seperti sebelumnya) ---
  const handleOpenModal = (mode, product = null) => {
    setModalMode(mode);
    if (mode === 'edit' && product) {
      setFormData({
        ...product,
        colors: product.colors?.join(', ') || '',
        sizes: product.sizes?.join(', ') || ''
      });
    } else {
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialForm);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const payload = {
        ...formData,
        price: parseInt(formData.price),
        colors: formData.colors.split(',').map(c => c.trim()).filter(Boolean),
        sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (modalMode === 'add') {
        await addProduct(payload);
        addToast(`Produk ${payload.name} berhasil ditambahkan!`, 'success');
      } else {
        await updateProduct(payload.id, payload);
        addToast(`Produk ${payload.name} berhasil diperbarui!`, 'success');
      }
      handleCloseModal();
      fetchProducts();
    } catch (error) {
      console.error(error);
      addToast('Terjadi kesalahan. Pastikan ID unik dan format benar.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDelete = async () => {
    setIsProcessing(true);
    try {
      await deleteProduct(deleteModal.id);
      addToast(`Produk berhasil dihapus!`, 'success');
      setDeleteModal({ isOpen: false, id: null, name: '' });
      fetchProducts();
    } catch (error) {
      console.error(error);
      addToast('Gagal menghapus produk.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Tahan layar kosong jika belum divalidasi (menghindari kedipan UI admin)
  if (!isInitialized || user?.role !== 'admin') {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 z-50 relative"></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row font-sans relative z-50">
      
      {/* Sidebar Admin */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col md:h-screen md:sticky md:top-0">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-2xl font-black text-foreground tracking-tight">Warhope<span className="text-blue-600">.</span></h1>
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest mt-1">Admin Panel</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500 rounded-xl font-bold transition-colors">
            <Package className="w-5 h-5" /> Produk
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-foreground/60 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-foreground/60 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">
            <ShoppingCart className="w-5 h-5" /> Pesanan
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition-colors">
            <LogOut className="w-5 h-5" /> Keluar (Logout)
          </button>
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-foreground/60 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">
            <ArrowLeft className="w-5 h-5" /> Kembali ke Toko
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-foreground tracking-tight">Kelola Produk</h2>
            <p className="text-sm text-foreground/60 mt-1">Atur katalog produk, harga, dan stok barang Anda.</p>
          </div>
          <button 
            onClick={() => handleOpenModal('add')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Tambah Produk
          </button>
        </div>

        {/* Tabel Data Produk */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-lg font-bold text-foreground">Daftar Produk ({products.length})</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input 
                type="text" 
                placeholder="Cari nama / ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all text-foreground"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-foreground/60 text-xs uppercase tracking-widest">
                  <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700">Produk</th>
                  <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700">Kategori</th>
                  <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700">Harga</th>
                  <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {isLoading ? (
                  <tr><td colSpan="4" className="p-8 text-center text-foreground/50">Memuat data...</td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-foreground/50">Tidak ada produk.</td></tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground">{product.name}</p>
                            <p className="text-xs text-foreground/50 mt-0.5">ID: {product.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><span className="inline-flex px-3 py-1 bg-slate-100 dark:bg-slate-800 text-foreground/70 rounded-full text-xs font-bold">{product.category}</span></td>
                      <td className="p-4"><span className="font-bold text-foreground text-sm">{formatRupiah(product.price)}</span></td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModal('edit', product)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit Produk">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteModal({ isOpen: true, id: product.id, name: product.name })} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Hapus Produk">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- MODAL TAMBAH / EDIT PRODUK --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-foreground">
                {modalMode === 'add' ? 'Tambah Produk Baru' : 'Edit Produk'}
              </h3>
              <button onClick={handleCloseModal} className="text-foreground/40 hover:text-foreground p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">ID Produk</label>
                  <input required name="id" value={formData.id} onChange={handleInputChange} disabled={modalMode === 'edit'} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground disabled:opacity-50" placeholder="Contoh: p-003" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Nama Produk</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground" placeholder="Nama barang" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Kategori</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground">
                    <option value="T-Shirts">T-Shirts</option>
                    <option value="Hoodies">Hoodies</option>
                    <option value="Pants">Pants</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Harga (Rp)</label>
                  <input required type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground" placeholder="249000" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">URL Gambar (Unsplash CDN)</label>
                  <input required name="image" value={formData.image} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground" placeholder="https://images.unsplash.com/..." />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Deskripsi</label>
                  <textarea required name="description" rows={3} value={formData.description} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground resize-none" placeholder="Penjelasan singkat produk..."></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Warna (Pisahkan dg koma)</label>
                  <input required name="colors" value={formData.colors} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground" placeholder="Hitam, Putih, Navy" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Ukuran (Pisahkan dg koma)</label>
                  <input required name="sizes" value={formData.sizes} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground" placeholder="S, M, L, XL" />
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-6 py-3 rounded-full font-bold text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Batal</button>
                <button type="submit" disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg active:scale-95 disabled:opacity-70 flex items-center gap-2">
                  {isProcessing ? 'Menyimpan...' : <><Save className="w-4 h-4" /> Simpan Produk</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL KONFIRMASI HAPUS --- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Hapus Produk?</h3>
            <p className="text-foreground/60 text-sm mb-8">Anda yakin ingin menghapus <strong>{deleteModal.name}</strong> secara permanen? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteModal({ isOpen: false, id: null, name: '' })} className="flex-1 py-3 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Batal</button>
              <button onClick={confirmDelete} disabled={isProcessing} className="flex-1 py-3 rounded-full font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-70">
                {isProcessing ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}