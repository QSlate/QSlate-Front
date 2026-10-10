'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';

import { Laptop3D } from '@/shared/ui/laptop-3d/Laptop3D';

export function LandingHero() {
  return (
    <section className="relative w-full pt-16 sm:pt-24 pb-16 sm:pb-24 overflow-hidden flex flex-col items-center">
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[400px] bg-gradient-to-tr from-cyan-500/10 via-emerald-400/10 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Hero Copy (Top Section) */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
        {/* Eyebrow Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-mono font-medium tracking-[0.2em] uppercase text-zinc-300 [data-theme=light]:text-zinc-600 bg-[#0d1117] [data-theme=light]:bg-black/5 border border-white/10 [data-theme=light]:border-black/10 shadow-xs"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Backtesting • Simulation • Risk</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-bold tracking-tight max-w-4xl leading-[1.08] font-sans"
        >
          <span className="text-white [data-theme=light]:text-zinc-950 block">
            The Flight Simulator for
          </span>
          <span className="bg-gradient-to-b from-white via-zinc-200 to-zinc-400 [data-theme=light]:from-zinc-950 [data-theme=light]:to-zinc-600 bg-clip-text text-transparent block">
            Quantitative Finance.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-sm sm:text-base md:text-lg text-zinc-400 [data-theme=light]:text-zinc-600 max-w-2xl leading-relaxed font-sans"
        >
          Bridge the gap between visual intuition and institutional rigor.
          Build, backtest, and stress-test algorithmic strategies with Rust
          speed and a dynamic widget workspace.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/lab"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-sans text-xs sm:text-sm font-semibold text-black bg-white hover:bg-zinc-200 [data-theme=light]:bg-black [data-theme=light]:text-white [data-theme=light]:hover:bg-zinc-800 shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <span>Start Backtesting Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#features"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-sans text-xs sm:text-sm font-medium text-white [data-theme=light]:text-zinc-800 bg-white/[0.06] [data-theme=light]:bg-black/5 border border-white/10 [data-theme=light]:border-black/10 hover:bg-white/10 [data-theme=light]:hover:bg-black/10 transition-all hover:scale-105 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 text-zinc-300 fill-current" />
            <span>Explore Live Demo</span>
          </a>
        </motion.div>
      </div>

      {/* 3D Laptop Showcase */}
      <div className="w-full max-w-5xl mx-auto px-4 mt-12 sm:mt-16 flex justify-center overflow-visible">
        <Laptop3D />
      </div>
    </section>
  );
}
