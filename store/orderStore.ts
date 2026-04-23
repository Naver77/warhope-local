import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Definisikan tipe data untuk mengatasi error TypeScript 'any' dan 'unknown'
export interface Customer {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
}

// Tambahkan interface untuk item pesanan agar tidak menggunakan 'any'
export interface OrderItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  category?: string;
  description?: string;
}

export interface Order {
  id: string;
  date: string;
  customer: Customer;
  items: OrderItem[]; // Gunakan OrderItem[] menggantikan any[]
  shippingCost: number;
  tax: number;
  totalAmount: number;
  status: string;
}

interface OrderState {
  orders: Order[];
  addOrder: (orderData: Order) => void;
  getOrdersByEmail: (email: string) => Order[];
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      
      // Menyimpan transaksi baru ke LocalStorage
      addOrder: (orderData) => {
        const currentOrders = get().orders;
        set({ orders: [orderData, ...currentOrders] });
      },

      // Opsional: Untuk melihat riwayat transaksi
      getOrdersByEmail: (email) => {
        return get().orders.filter(order => order.customer.email === email);
      }
    }),
    {
      name: 'warhope_orders', // Disimpan di Local Storage sesuai syarat UTS
    }
  )
);