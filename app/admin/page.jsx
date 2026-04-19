"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { getAllProducts, addProduct, updateProduct, deleteProduct } from '../../lib/api';

import { 
  LogOut, PackageSearch, ShoppingBag, TrendingUp, RefreshCw,
  Search, Eye, CheckCircle, Clock, XCircle, Plus, Edit, 
  Trash2, X, Save, AlertTriangle, ArrowLeft, 
  MapPin, Phone, Mail, Truck
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isInitialized, checkAuth, logout } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  
  const [activeTab, setActiveTab] = useState('orders');
  
  // --- STATE ORDERS ---
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [searchOrderTerm, setSearchOrderTerm] = useState("");
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  useEffect(() => { checkAuth(); }, [checkAuth]);

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

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const { data, err } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!err) setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    const data = await getAllProducts();
    setProducts(data || []);
    setIsLoadingProducts(false);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const { error: err } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (err) throw err;
      
      addToast(`Status diubah menjadi ${newStatus}`, 'success');
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      
    } catch (err) {
      console.error(err);
      addToast('Gagal memperbarui status.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleOpenModal = (mode, product = null) => {
    setModalMode(mode);
    if (mode === 'edit' && product) {
      setFormData({ ...product, colors: product.colors?.join(', ') || '', sizes: product.sizes?.join(', ') || '' });
    } else setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setFormData(initialForm); };
  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

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
        addToast(`Produk ditambahkan!`, 'success');
      } else {
        await updateProduct(payload.id, payload);
        addToast(`Produk diperbarui!`, 'success');
      }
      handleCloseModal(); fetchProducts();
    } catch (err) {
      console.error(err);
      addToast('Gagal menyimpan produk.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDelete = async () => {
    setIsProcessing(true);
    try {
      await deleteProduct(deleteModal.id);
      addToast(`Produk dihapus!`, 'success');
      setDeleteModal({ isOpen: false, id: null, name: '' });
      fetchProducts();
    } catch (err) {
      console.error(err);
      addToast('Gagal menghapus produk.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => { logout(); router.push('/auth/login'); };

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID': case 'SUCCESS':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold w-fit"><CheckCircle className="w-3.5 h-3.5" /> LUNAS</span>;
      case 'DIKIRIM': case 'SHIPPED':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold w-fit"><Truck className="w-3.5 h-3.5" /> DIKIRIM</span>;
      case 'PENDING':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold w-fit"><Clock className="w-3.5 h-3.5" /> TERTUNDA</span>;
      case 'FAILED': case 'EXPIRED':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold w-fit"><XCircle className="w-3.5 h-3.5" /> GAGAL</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold w-fit">{status}</span>;
    }
  };

  if (!isInitialized || user?.role !== 'admin') return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 z-50 relative"></div>;

  const filteredOrders = orders.filter(order => order.invoice_number?.toLowerCase().includes(searchOrderTerm.toLowerCase()) || order.customer_name?.toLowerCase().includes(searchOrderTerm.toLowerCase()));
  const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchProductTerm.toLowerCase()) || product.id.toLowerCase().includes(searchProductTerm.toLowerCase()));
  const totalOmset = orders.filter(o => ['PAID', 'SUCCESS', 'DIKIRIM'].includes(o.status)).reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

  // =========================================================================
  // HELPER RENDER FUNCTIONS
  // =========================================================================

  const renderSidebar = () => (
    <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col md:h-screen md:sticky md:top-0 shrink-0">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-black text-foreground tracking-tight">Warhope<span className="text-blue-600">.</span></h1>
        <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest mt-1">Admin Panel</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <ShoppingBag className="w-5 h-5" /> Pesanan
        </button>
        <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'products' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <PackageSearch className="w-5 h-5" /> Katalog Produk
        </button>
      </nav>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition-colors"><LogOut className="w-5 h-5" /> Keluar</button>
        <Link href="/" className="flex items-center gap-3 px-4 py-3 text-foreground/60 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"><ArrowLeft className="w-5 h-5" /> Kembali ke Toko</Link>
      </div>
    </aside>
  );

  const renderOrdersTab = () => (
    <div className="animate-in fade-in duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div><h2 className="text-3xl font-bold tracking-tight text-foreground">Manajemen Pesanan</h2><p className="text-slate-500 dark:text-slate-400 mt-1">Pantau dan kelola semua transaksi masuk.</p></div>
        <button onClick={fetchOrders} disabled={isLoadingOrders} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin' : ''}`} /> Segarkan
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center shrink-0"><ShoppingBag className="w-6 h-6" /></div>
          <div><p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Pesanan</p><h3 className="text-2xl font-black text-foreground">{orders.length}</h3></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center shrink-0"><Clock className="w-6 h-6" /></div>
          <div><p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Menunggu Pembayaran</p><h3 className="text-2xl font-black text-foreground">{orders.filter(o => o.status === 'PENDING').length}</h3></div>
        </div>
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-lg shadow-blue-900/20 text-white flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0"><TrendingUp className="w-6 h-6" /></div>
          <div><p className="text-sm font-semibold text-blue-100">Total Omset (Lunas/Dikirim)</p><h3 className="text-2xl font-black">{formatRupiah(totalOmset)}</h3></div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-foreground">Daftar Transaksi</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari Invoice atau Nama..." value={searchOrderTerm} onChange={(e) => setSearchOrderTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
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
                    <td className="px-6 py-4"><p className="font-bold text-foreground">{order.invoice_number}</p><p className="text-xs text-slate-500">{formatDate(order.created_at)}</p></td>
                    <td className="px-6 py-4"><p className="font-semibold text-foreground">{order.customer_name}</p><p className="text-xs text-slate-500 max-w-50 truncate" title={order.shipping_address}>{order.shipping_address}</p></td>
                    <td className="px-6 py-4 font-bold text-foreground">{formatRupiah(order.total_amount)}</td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => openOrderDetail(order)} className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors" title="Lihat Detail">
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
        <div><h2 className="text-3xl font-bold tracking-tight text-foreground">Katalog Produk</h2><p className="text-slate-500 dark:text-slate-400 mt-1">Atur harga, gambar, dan deskripsi pakaian Anda.</p></div>
        <button onClick={() => handleOpenModal('add')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"><Plus className="w-5 h-5" /> Tambah Produk</button>
      </header>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-foreground">Daftar Produk ({products.length})</h3>
          <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Cari nama / ID..." value={searchProductTerm} onChange={(e) => setSearchProductTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-sm"><tr><th className="px-6 py-4">Produk</th><th className="px-6 py-4">Kategori</th><th className="px-6 py-4">Harga</th><th className="px-6 py-4 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoadingProducts ? <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">Memuat data produk...</td></tr> : filteredProducts.map((product) => (
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
                  <td className="px-6 py-4"><span className="inline-flex px-3 py-1 bg-slate-100 dark:bg-slate-800 text-foreground/70 rounded-md text-xs font-bold">{product.category}</span></td>
                  <td className="px-6 py-4 font-bold text-foreground">{formatRupiah(product.price)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal('edit', product)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteModal({ isOpen: true, id: product.id, name: product.name })} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderModals = () => {
    const getOrderItems = () => {
      if (!selectedOrder?.items) return [];
      try { return typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items) : selectedOrder.items; } 
      catch { return []; }
    };
    const orderItems = getOrderItems();

    return (
      <>
        {/* --- MODAL DETAIL PESANAN --- */}
        {isOrderModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <div>
                  <h3 className="text-2xl font-black text-foreground flex items-center gap-3">
                    {selectedOrder.invoice_number} {getStatusBadge(selectedOrder.status)}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <button onClick={() => setIsOrderModalOpen(false)} className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 p-2 rounded-full transition-colors"><X className="w-5 h-5 text-foreground" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Informasi Pelanggan</h4>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl space-y-4">
                        <div className="flex items-start gap-3"><div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm shrink-0"><CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div><div><p className="text-xs text-slate-500">Nama Lengkap</p><p className="font-bold text-foreground">{selectedOrder.customer_name}</p></div></div>
                        <div className="flex items-start gap-3"><div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm shrink-0"><Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div><div><p className="text-xs text-slate-500">Email</p><p className="font-bold text-foreground">{selectedOrder.customer_email}</p></div></div>
                        <div className="flex items-start gap-3"><div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm shrink-0"><Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div><div><p className="text-xs text-slate-500">Nomor WhatsApp</p><p className="font-bold text-foreground">{selectedOrder.customer_phone}</p></div></div>
                        <div className="flex items-start gap-3"><div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm shrink-0"><MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div><div><p className="text-xs text-slate-500">Alamat Pengiriman</p><p className="font-bold text-foreground text-sm leading-relaxed">{selectedOrder.shipping_address}</p></div></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Rincian Belanja</h4>
                    <div className="space-y-4 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
                      {orderItems.map((item, idx) => (
                        <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 flex flex-col justify-center">
                            <h5 className="font-bold text-foreground text-sm leading-tight">{item.name}</h5>
                            <div className="flex gap-2 mt-1"><span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300">Size: {item.selectedSize}</span><span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300">Color: {item.selectedColor || '-'}</span></div>
                            <div className="flex justify-between items-end mt-2"><span className="text-xs font-bold text-foreground">Qty: {item.quantity}</span><span className="font-black text-blue-600 dark:text-blue-400 text-sm">{formatRupiah(item.price)}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 bg-slate-900 dark:bg-black rounded-2xl p-5 text-white">
                      <div className="flex justify-between items-center mb-2 text-slate-400 text-sm"><span>Total Tagihan Dibayar</span></div>
                      <div className="flex justify-between items-end"><span className="text-3xl font-black text-blue-400">{formatRupiah(selectedOrder.total_amount)}</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center gap-4">
                {selectedOrder.status === 'PENDING' ? (
                  <p className="text-sm text-amber-600 font-bold flex items-center gap-2"><Clock className="w-4 h-4"/> Menunggu pelanggan membayar.</p>
                ) : selectedOrder.status === 'PAID' || selectedOrder.status === 'SUCCESS' ? (
                  <div className="flex items-center gap-3 w-full justify-end">
                    <p className="text-sm text-slate-500 mr-auto hidden sm:block">Pesanan sudah lunas. Segera proses pengiriman.</p>
                    <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'DIKIRIM')} disabled={isUpdatingStatus} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2">
                      {isUpdatingStatus ? 'Memproses...' : <><Truck className="w-4 h-4" /> Tandai Sudah Dikirim</>}
                    </button>
                  </div>
                ) : selectedOrder.status === 'DIKIRIM' ? (
                  <div className="flex items-center gap-3 w-full justify-end"><p className="text-sm text-green-600 font-bold flex items-center gap-2 mr-auto"><CheckCircle className="w-4 h-4"/> Paket sedang dalam perjalanan.</p></div>
                ) : (
                  <p className="text-sm text-red-500 font-bold">Transaksi Gagal / Kadaluarsa</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL ADD/EDIT PRODUCT --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-foreground">{modalMode === 'add' ? 'Tambah Produk Baru' : 'Edit Produk'}</h3>
                <button onClick={handleCloseModal} className="text-foreground/40 hover:text-foreground p-1"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmitProduct} className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">ID Produk</label><input required name="id" value={formData.id} onChange={handleInputChange} disabled={modalMode === 'edit'} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground disabled:opacity-50" placeholder="Contoh: p-003" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Nama Produk</label><input required name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground" placeholder="Nama barang" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Kategori</label><select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground"><option value="T-Shirts">T-Shirts</option><option value="Hoodies">Hoodies</option><option value="Pants">Pants</option><option value="Accessories">Accessories</option></select></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Harga (Rp)</label><input required type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground" placeholder="249000" /></div>
                  <div className="space-y-2 md:col-span-2"><label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">URL Gambar (Unsplash CDN)</label><input required name="image" value={formData.image} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground" placeholder="https://images.unsplash.com/..." /></div>
                  <div className="space-y-2 md:col-span-2"><label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Deskripsi</label><textarea required name="description" rows={3} value={formData.description} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground resize-none" placeholder="Penjelasan singkat produk..."></textarea></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Warna (Pisahkan dg koma)</label><input required name="colors" value={formData.colors} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground" placeholder="Hitam, Putih, Navy" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Ukuran (Pisahkan dg koma)</label><input required name="sizes" value={formData.sizes} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-foreground" placeholder="S, M, L, XL" /></div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                  <button type="button" onClick={handleCloseModal} className="px-6 py-3 rounded-full font-bold text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Batal</button>
                  <button type="submit" disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg active:scale-95 disabled:opacity-70 flex items-center gap-2">{isProcessing ? 'Menyimpan...' : <><Save className="w-4 h-4" /> Simpan Produk</>}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL CONFIRM DELETE --- */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
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
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0A] flex flex-col md:flex-row font-sans relative z-50">
      {renderSidebar()}
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
        {activeTab === 'orders' && renderOrdersTab()}
        {activeTab === 'products' && renderProductsTab()}
      </main>
      {renderModals()}
    </div>
  );
}