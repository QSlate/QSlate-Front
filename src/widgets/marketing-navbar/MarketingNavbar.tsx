'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Moon, Sun, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useTheme } from '@/shared/theme/theme-provider';

export function MarketingNavbar() {
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 left-0 right-0 z-50 flex flex-col items-center px-4 pt-3 pointer-events-none">
      <nav
        aria-label="Main Navigation"
        className={`pointer-events-auto w-full max-w-5xl rounded-2xl transition-all duration-300 ${
          isScrolled
            ? 'apple-liquid-glass py-3 px-5 sm:px-6'
            : 'apple-liquid-glass-idle py-2.5 px-4 sm:px-6'
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden transition-transform group-hover:scale-105 flex items-center justify-center">
              <Image
                src="/logo-dark.png"
                alt="QSlate Logo"
                width={28}
                height={28}
                className="w-7 h-7 object-contain light:hidden block"
                priority
              />
              <Image
                src="/logo-light.png"
                alt="QSlate Logo"
                width={28}
                height={28}
                className="w-7 h-7 object-contain hidden light:block"
                priority
              />
            </div>
            <span className="text-base font-semibold tracking-tight text-white light:text-zinc-950 font-sans">
              QSlate
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300 light:text-zinc-600 font-sans">
            <a
              href="#features"
              className="hover:text-white light:hover:text-zinc-950 transition-colors"
            >
              Features
            </a>
            <a
              href="#architecture"
              className="hover:text-white light:hover:text-zinc-950 transition-colors"
            >
              Architecture
            </a>
            <a
              href="#marketplace"
              className="hover:text-white light:hover:text-zinc-950 transition-colors"
            >
              Marketplace
            </a>
            <a
              href="#docs"
              className="hover:text-white light:hover:text-zinc-950 transition-colors"
            >
              Docs
            </a>
          </div>

          {/* Action CTAs & Theme Switcher */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle visual theme"
              className="p-2 rounded-full bg-white/10 hover:bg-white/15 light:bg-black/[0.04] light:hover:bg-black/[0.08] border border-white/15 light:border-black/10 text-zinc-200 light:text-zinc-700 hover:text-white light:hover:text-black transition-all hover:scale-105 shadow-sm"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Sign In */}
            <Link
              href="/auth/signin"
              className="hidden sm:inline-flex text-xs font-medium text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-black px-3 py-2 transition-colors font-sans"
            >
              Sign In
            </Link>

            {/* Launch Dashboard Primary Button */}
            <Link
              href="/lab"
              className="relative inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold font-sans text-black bg-white hover:bg-zinc-100 light:bg-zinc-900 light:text-white light:hover:bg-black shadow-[0_4px_14px_rgba(0,0,0,0.25)] light:shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-all hover:scale-105 active:scale-95"
            >
              <span>Launch Dashboard</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="md:hidden p-2 rounded-lg bg-white/10 light:bg-black/5 border border-white/15 light:border-black/10 text-zinc-200 light:text-zinc-700 hover:text-white light:hover:text-black"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pt-4 pb-2 border-t border-white/10 light:border-black/10 mt-3 flex flex-col gap-3 font-sans text-sm"
            >
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-black py-1"
              >
                Features
              </a>
              <a
                href="#architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-black py-1"
              >
                Architecture
              </a>
              <a
                href="#marketplace"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-black py-1"
              >
                Marketplace
              </a>
              <a
                href="#docs"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-black py-1"
              >
                Docs
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
