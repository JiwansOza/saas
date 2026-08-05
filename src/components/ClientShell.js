"use client";

// Client-only shell: keeps the scroll/mounted state that the Navbar needs, so the
// RootLayout can stay a SERVER component (needed to read the session cookie and sign
// the Preta context JWT at request time).
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ClientShell({ children }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
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
  );
}
