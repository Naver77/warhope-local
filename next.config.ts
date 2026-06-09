import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Tambahkan domain Supabase Anda di sini
      {
        protocol: 'https',
        hostname: 'oeogemgxwszyjkxudlpq.supabase.co',
      },
    ],
  },
};

export default nextConfig;