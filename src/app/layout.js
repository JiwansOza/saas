"use client";

import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        // <Script
        //   src="https://yash-loader-worker.pushkarnagwekar.workers.dev/?d=saas-nextjs-flax.vercel.app"
        //   data-api="https://preta-dashboard-phase1.pushkarnagwekar.workers.dev/api"
        //   data-ctx-endpoint="/users/preta-token"
        //   data-debug="true"
        //   strategy="afterInteractive"
        // />
  <Script
  src="https://audiance-loader-worker.pushkarnagwekar.workers.dev/?d=saas-nextjs-flax.vercel.app"
  data-api="https://preta-dashboard-phase1.pushkarnagwekar.workers.dev/api"
  data-ctx-endpoint="/users/preta-token"
  data-debug="true"
  strategy="afterInteractive"
/>

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar isScrolled={isScrolled} mounted={mounted} />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
