import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ToastProvider from "../components/ToastProvider"; // IMPORT TOAST PROVIDER

// Menggunakan Inter sesuai konsep PDF
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Warhope | E-Commerce",
  description: "Modern Casual Apparel & Streetwear",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className="scroll-smooth"> 
      <body 
        suppressHydrationWarning 
        // Ditambahkan bg-background dan text-foreground agar tema (Light/Dark) dari globals.css merata ke seluruh aplikasi
        className={`${inter.className} bg-background text-foreground antialiased selection:bg-blue-600 selection:text-white`}
      >
        <Navbar /> 
        
        {/* Main wrapper agar konten tidak tertutup navbar (padding top 20 / 5rem) */}
        <main className="pt-20 min-h-screen">
          {children}
        </main>

        <Footer />

        {/* Letakkan ToastProvider di paling bawah body agar bisa menimpa (z-index) elemen lain */}
        <ToastProvider />
      </body>
    </html>
  );
}