import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Boutique E-Commerce",
  description: "Boutique Digital Flagship",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning ditambahkan di sini
    <html lang="id" suppressHydrationWarning> 
      <body 
        suppressHydrationWarning 
        className={`${inter.className} bg-[#f5f6f7] text-slate-900 selection:bg-blue-200`}
      >
        <Navbar /> 
        {children}
        <Footer />
      </body>
    </html>
  );
}