'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react';
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
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 sm:pt-6 pointer-events-none">
      <nav
        aria-label="Main Navigation"
        className={`pointer-events-auto w-full max-w-6xl rounded-2xl transition-all duration-300 ${
          isScrolled
            ? 'bg-[#050505]/80 [data-theme=light]:bg-white/80 backdrop-blur-xl border border-white/10 [data-theme=light]:border-black/5 shadow-2xl py-3 px-5 sm:px-6'
            : 'bg-transparent py-4 px-4 sm:px-6'
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden transition-transform group-hover:scale-105 flex items-center justify-center">
              <Image
                src="/logo-dark.png"
                alt="QSlate Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain [data-theme=light]:hidden block"
                priority
              />
              <Image
                src="/logo-light.png"
                alt="QSlate Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain hidden [data-theme=light]:block"
                priority
              />
            </div>
            <span className="text-lg font-bold tracking-tight text-white [data-theme=light]:text-zinc-900 font-mono">
              QSlate
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-wider font-medium text-zinc-400 [data-theme=light]:text-zinc-600">
            <a
              href="#features"
              className="hover:text-white [data-theme=light]:hover:text-zinc-900 transition-colors"
            >
              Features
            </a>
            <a
              href="#architecture"
              className="hover:text-white [data-theme=light]:hover:text-zinc-900 transition-colors"
            >
              Architecture
            </a>
            <a
              href="#personas"
              className="hover:text-white [data-theme=light]:hover:text-zinc-900 transition-colors"
            >
              Personas
            </a>
            <a
              href="#docs"
              className="hover:text-white [data-theme=light]:hover:text-zinc-900 transition-colors"
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
              className="p-2 rounded-xl bg-white/5 [data-theme=light]:bg-black/5 border border-white/10 [data-theme=light]:border-black/5 text-zinc-300 [data-theme=light]:text-zinc-700 hover:text-white [data-theme=light]:hover:text-black transition-all hover:scale-105"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Sign In */}
            <Link
              href="/auth/signin"
              className="hidden sm:inline-flex text-xs font-medium text-zinc-300 [data-theme=light]:text-zinc-700 hover:text-white [data-theme=light]:hover:text-black px-3 py-2 transition-colors"
            >
              Sign In
            </Link>

            {/* Launch Dashboard Primary Button */}
            <Link
              href="/lab"
              className="relative inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-mono text-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 hover:brightness-110 shadow-[0_0_20px_rgba(0,255,178,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300"
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
              className="md:hidden pt-4 pb-2 border-t border-white/10 mt-3 flex flex-col gap-3 font-mono text-sm"
            >
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 hover:text-white py-1"
              >
                Features
              </a>
              <a
                href="#architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 hover:text-white py-1"
              >
                Architecture
              </a>
              <a
                href="#personas"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 hover:text-white py-1"
              >
                Personas
              </a>
              <a
                href="#docs"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 hover:text-white py-1"
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
