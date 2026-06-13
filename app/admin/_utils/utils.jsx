import React from 'react';
import { CheckCircle, Truck, Clock, XCircle } from 'lucide-react';

export const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

export const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const getStatusBadge = (status) => {
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