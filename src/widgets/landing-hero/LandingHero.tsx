'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

import { Laptop3D } from '@/shared/ui/laptop-3d/Laptop3D';

export function LandingHero() {
  const runwayRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ['start start', 'end end'],
  });

  // Hero text gracefully recedes as the laptop opens into full view
  const textOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0.15]);
  const textScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.94]);
  const textY = useTransform(scrollYProgress, [0, 0.35], [0, -40]);

  return (
    <section ref={runwayRef} className="relative w-full h-[180vh] sm:h-[200vh]">
      {/* Pinned Viewport Container */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-between pt-24 sm:pt-28 pb-6 overflow-hidden">
        {/* Background Ambient Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[500px] bg-gradient-to-tr from-cyan-500/10 via-emerald-400/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Hero Copy (Top Section) */}
        <motion.div
          style={{ opacity: textOpacity, scale: textScale, y: textY }}
          className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto"
        >
          {/* Announcement Pill */}
          <Link
            href="#features"
            className="group mb-5 inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-medium bg-white/5 [data-theme=light]:bg-black/5 border border-white/10 [data-theme=light]:border-black/10 text-zinc-300 [data-theme=light]:text-zinc-700 hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>
              QSlate Kernel 2.0: Tick-level precision simulation is live
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Eyebrow Micro-Track */}
          <div className="text-[11px] uppercase tracking-[0.25em] font-mono font-semibold text-cyan-400 mb-3">
            Backtesting • Simulation • Risk
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white [data-theme=light]:text-zinc-950 max-w-3xl leading-[1.1] font-mono">
            The Flight Simulator for{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Quantitative Finance.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-base md:text-lg text-zinc-400 [data-theme=light]:text-zinc-600 max-w-2xl leading-relaxed">
            Bridge the gap between visual intuition and institutional rigor.
            Build, backtest, and stress-test algorithmic strategies with Rust
            speed and a dynamic widget workspace.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/lab"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-xs sm:text-sm font-semibold text-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 hover:brightness-110 shadow-[0_0_30px_rgba(0,255,178,0.35)] transition-all hover:scale-105 active:scale-95"
            >
              <span>Start Backtesting Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-xs sm:text-sm font-medium text-zinc-300 [data-theme=light]:text-zinc-700 bg-white/5 [data-theme=light]:bg-black/5 border border-white/10 [data-theme=light]:border-black/10 hover:bg-white/10 [data-theme=light]:hover:bg-black/10 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              <span>Explore Live Demo</span>
            </a>
          </div>
        </motion.div>

        {/* 3D Scroll Laptop Showcase (Centered in Pinned View) */}
        <div className="w-full flex-1 flex items-center justify-center overflow-visible">
          <Laptop3D progress={scrollYProgress} />
        </div>
      </div>
    </section>
  );
}
