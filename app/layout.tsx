import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Analytics } from "@vercel/analytics/next"; // 1. IMPORT VERCEL ANALYTICS
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ToastProvider from "../components/ToastProvider";
import AuthListener from "../components/AuthListener"; 

// 2. Konfigurasi Font
const modernFont = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  display: 'swap',
  // weight: ['400', '500', '600', '700', '800'], // (Opsional) Jika ingin dilimitasi ketebalannya
});

export const metadata: Metadata = {
  metadataBase: new URL('https://warhope-ecom.vercel.app'), 
  title: {
    default: "Warhope Apparel | Premium Heavyweight Streetwear",
    template: "%s | Warhope Apparel", 
  },
  description:
    "Eksplorasi gaya urban sejati dengan Warhope Apparel. Temukan koleksi heavyweight streetwear premium: Boxy T-Shirt, Hoodie, dan Celana dengan kualitas material terbaik di Indonesia.",
  keywords: [
    "Warhope", "Warhope Apparel", "Streetwear Indonesia", "Heavyweight T-Shirt", 
    "Boxy Fit", "Hoodie Premium", "Fashion Pria", "Baju Oversize"
  ],
  authors: [{ name: "Warhope Team" }],
  creator: "Warhope Apparel",
  publisher: "Warhope Apparel",
  
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://warhope-ecom.vercel.app", 
    siteName: "Warhope Apparel",
    title: "Warhope Apparel | Premium Heavyweight Streetwear",
    description: "Koleksi streetwear premium dengan kualitas material terbaik. Tampil beda dengan gaya urban sejati bersama Warhope.",
    images: [
      {
        url: "https://warhope-ecom.vercel.app/assets/warhope-og-banner.png", 
        width: 1200,
        height: 630,
        alt: "Warhope Apparel Official Banner",
      },
    ],
  },
  
  twitter: {
    card: "summary_large_image",
    title: "Warhope Apparel | Premium Streetwear",
    description: "Koleksi streetwear premium dengan kualitas material terbaik. Wujudkan gaya urban Anda!",
    images: ["https://warhope-ecom.vercel.app/assets/warhope-og-banner.png"], 
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className="scroll-smooth" data-scroll-behavior="smooth"> 
      <body 
        suppressHydrationWarning 
        className={`${modernFont.className} bg-background text-foreground antialiased selection:bg-blue-600 selection:text-white`}
      >
        {/* LISTENER DILETAKKAN DI SINI, DI LUAR STRUKTUR VISUAL */}
        <AuthListener />

        <Navbar /> 
        
        <main className="min-h-screen">
          {children}
        </main>

        <Footer />
        <ToastProvider />
        
        {/* 2. KOMPONEN ANALYTICS DARI VERCEL */}
        <Analytics />
      </body>
    </html>
  );
}