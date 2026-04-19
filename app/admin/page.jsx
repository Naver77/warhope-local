"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { getAllProducts, addProduct, updateProduct, deleteProduct } from '../lib/api';

import { 
  LogOut, 
  PackageSearch, 
  ShoppingBag, 
  TrendingUp,
  RefreshCw,
  Search,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

// Inisialisasi Supabase Client (Frontend) untuk Orders
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isInitialized, checkAuth, logout } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  
  // --- STATE TAB & GLOBAL ---
  const [activeTab, setActiveTab] = useState('orders');
  
  // --- STATE ORDERS ---
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [searchOrderTerm, setSearchOrderTerm] = useState("");

  // --- STATE PRODUCTS ---
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchProductTerm, setSearchProductTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  const initialForm = { id: '', name: '', category: 'T-Shirts', price: '', description: '', image: '', colors: '', sizes: '' };
  const [formData, setFormData] = useState(initialForm);

  // --- PROTEKSI & INIT LENGKAP ---
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
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'products') fetchProducts();
      }
    }
  }, [isInitialized, user, router, addToast, activeTab]);

  // --- FUNGSI ORDERS ---
  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error("Gagal menarik pesanan:", error);
      else setOrders(data || []);
    } catch (err) {
      console.error("Kesalahan fetch order:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // --- FUNGSI PRODUCTS ---
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    const data = await getAllProducts();
    setProducts(data || []);
    setIsLoadingProducts(false);
  };

  // --- CRUD PRODUCTS HANDLERS ---
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

  const handleSubmitProduct = async (e) => {
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
      addToast('Terjadi kesalahan. Pastikan ID unik.', 'error');
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

  // --- UTILITAS ---
  const handleLogout = () => {
    logout();
    addToast('Anda telah keluar dari panel admin.', 'info');
    router.push('/auth/login');
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
      case 'SUCCESS':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold w-fit">
            <CheckCircle className="w-3.5 h-3.5" /> LUNAS
          </span>
        );
      case 'PENDING':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold w-fit">
            <Clock className="w-3.5 h-3.5" /> TERTUNDA
          </span>
        );
      case 'FAILED':
      case 'EXPIRED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold w-fit">
            <XCircle className="w-3.5 h-3.5" /> GAGAL
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold w-fit">
            {status}
          </span>
        );
    }
  };

  // Variabel Turunan
  const filteredOrders = orders.filter(order => 
    order.invoice_number?.toLowerCase().includes(searchOrderTerm.toLowerCase()) ||
    order.customer_name?.toLowerCase().includes(searchOrderTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchProductTerm.toLowerCase()) ||
    product.id.toLowerCase().includes(searchProductTerm.toLowerCase())
  );

  const totalOmset = orders
    .filter(o => o.status === 'PAID' || o.status === 'SUCCESS')
    .reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

  // RENDER PERSIAPAN
  if (!isInitialized || user?.role !== 'admin') {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 z-50 relative"></div>;
  }

  // =========================================================================
  // HELPER RENDER FUNCTIONS (Pemecah Komponen agar rapi)
  // =========================================================================

  const renderSidebar = () => (
    <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col md:h-screen md:sticky md:top-0 shrink-0">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-black text-foreground tracking-tight">Warhope<span className="text-blue-600">.</span></h1>
        <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest mt-1">Admin Panel</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'orders' 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="w-5 h-5" /> Pesanan
        </button>
        
        <button 
          onClick={() => setActiveTab('products')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'products' 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PackageSearch className="w-5 h-5" /> Katalog Produk
        </button>
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition-colors">
          <LogOut className="w-5 h-5" /> Keluar
        </button>
        <Link href="/" className="flex items-center gap-3 px-4 py-3 text-foreground/60 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">
          <ArrowLeft className="w-5 h-5" /> Kembali ke Toko
        </Link>
      </div>
    </aside>
  );

  const renderOrdersTab = () => (
    <div className="animate-in fade-in duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Manajemen Pesanan</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pantau dan kelola semua transaksi masuk.</p>
        </div>
        <button 
          onClick={fetchOrders}
          disabled={isLoadingOrders}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin' : ''}`} />
          Segarkan
        </button>
      </header>

      {/* Widget Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Pesanan</p>
            <h3 className="text-2xl font-black text-foreground">{orders.length}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Menunggu Pembayaran</p>
            <h3 className="text-2xl font-black text-foreground">{orders.filter(o => o.status === 'PENDING').length}</h3>
          </div>
        </div>
        {/* PERBAIKAN CSS LINTER: bg-gradient-to-br menjadi bg-linear-to-br */}
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-lg shadow-blue-900/20 text-white flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-100">Total Omset (Lunas)</p>
            <h3 className="text-2xl font-black">{formatRupiah(totalOmset)}</h3>
          </div>
        </div>
      </div>

      {/* Tabel Pesanan */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-foreground">Daftar Transaksi</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari Invoice atau Nama..." 
              value={searchOrderTerm}
              onChange={(e) => setSearchOrderTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Invoice & Waktu</th>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4">Total Belanja</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoadingOrders ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">Memuat data pesanan...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">Tidak ada data pesanan.</td></tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground">{order.invoice_number}</p>
                      <p className="text-xs text-slate-500">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">{order.customer_name}</p>
                      {/* PERBAIKAN CSS LINTER: max-w-[200px] menjadi max-w-50 */}
                      <p className="text-xs text-slate-500 max-w-50 truncate" title={order.shipping_address}>{order.shipping_address}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">{formatRupiah(order.total_amount)}</td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Lihat Detail" onClick={() => alert(`Fitur Detail: ${order.invoice_number}`)}>
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProductsTab = () => (
    <div className="animate-in fade-in duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Katalog Produk</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Atur harga, gambar, dan deskripsi pakaian Anda.</p>
        </div>
        <button 
          onClick={() => handleOpenModal('add')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Tambah Produk
        </button>
      </header>

      {/* Tabel Produk */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-foreground">Daftar Produk ({products.length})</h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama / ID..." 
              value={searchProductTerm}
              onChange={(e) => setSearchProductTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
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
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">Memuat data produk...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">Tidak ada produk ditemukan.</td></tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{product.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">ID: {product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 bg-slate-100 dark:bg-slate-800 text-foreground/70 rounded-md text-xs font-bold">{product.category}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">{formatRupiah(product.price)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
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
    </div>
  );

  const renderModals = () => (
    <>
      {/* Modal Add/Edit Product */}
      {isModalOpen && (
        // PERBAIKAN CSS LINTER: z-[100] menjadi z-100
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
            <form onSubmit={handleSubmitProduct} className="p-6 overflow-y-auto max-h-[70vh]">
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

      {/* Modal Confirm Delete */}
      {deleteModal.isOpen && (
        // PERBAIKAN CSS LINTER: z-[100] menjadi z-100
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
    </>
  );

  // =========================================================================
  // RENDER UTAMA
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0A] flex flex-col md:flex-row font-sans relative z-50">
      {renderSidebar()}
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
        {activeTab === 'orders' && renderOrdersTab()}
        {activeTab === 'products' && renderProductsTab()}
      </main>
      {activeTab === 'products' && renderModals()}
    </div>
  );
}