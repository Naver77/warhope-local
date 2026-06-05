import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Peringatan: Kredensial Supabase (URL atau Anon Key) belum diatur di .env.local!");
}

// Fungsi Singleton untuk Client Standar
const getSupabaseClient = () => {
  if (!globalThis.supabaseClient) {
    globalThis.supabaseClient = createClient(
      supabaseUrl || 'https://placeholder.supabase.co', 
      supabaseAnonKey || 'placeholder-key'
    );
  }
  return globalThis.supabaseClient;
};

// Fungsi Singleton untuk Client Admin
const getSupabaseAdmin = () => {
  if (!globalThis.supabaseAdmin) {
    globalThis.supabaseAdmin = createClient(
      supabaseUrl || 'https://placeholder.supabase.co', 
      supabaseServiceKey || 'placeholder-key', 
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  return globalThis.supabaseAdmin;
};

// 1. Client Standar (Digunakan di UI / Client Components)
export const supabase = getSupabaseClient();

// 2. Client Admin (HANYA UNTUK SERVER: API Routes / Webhook)
// Ini bisa bypass RLS (Row Level Security) untuk update status pesanan & stok
export const supabaseAdmin = typeof window === 'undefined' ? getSupabaseAdmin() : null;