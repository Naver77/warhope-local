import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Pengecekan agar Next.js tidak crash jika .env belum diisi dengan benar
if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Peringatan: Kredensial Supabase (URL atau Anon Key) belum diatur di file .env.local!");
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-key');