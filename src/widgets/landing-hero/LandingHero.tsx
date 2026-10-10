'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

import { Laptop3D } from '@/shared/ui/laptop-3d/Laptop3D';

export function LandingHero() {
  const runwayRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ['start start', 'end end'],
  });

  // Hero copy gracefully fades and recedes slightly as the MacBook opens into full glory
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.2]);
  const textY = useTransform(scrollYProgress, [0, 0.4], [0, -40]);
  const scrollPromptOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <section ref={runwayRef} className="relative w-full h-[200vh] sm:h-[220vh]">
      {/* Sticky Pinned Viewport Container */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-between pt-16 sm:pt-20 pb-4 overflow-hidden">
        {/* Background Ambient Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[400px] bg-gradient-to-tr from-cyan-500/10 via-emerald-400/10 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />

        {/* Hero Copy (Top Section) */}
        <motion.div
          style={{ opacity: textOpacity, y: textY }}
          className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto shrink-0"
        >
          {/* Eyebrow Pill */}
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-mono font-medium tracking-[0.2em] uppercase text-zinc-300 light:text-zinc-600 bg-[#0d1117] light:bg-black/5 border border-white/10 light:border-black/10 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Backtesting • Simulation • Risk</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[68px] font-bold tracking-tight max-w-4xl leading-[1.08] font-sans">
            <span className="text-white light:text-zinc-950 block">
              The Flight Simulator for
            </span>
            <span className="bg-gradient-to-b from-white via-zinc-200 to-zinc-400 light:from-zinc-950 light:to-zinc-600 bg-clip-text text-transparent block">
              Quantitative Finance.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-xs sm:text-sm md:text-base text-zinc-400 light:text-zinc-600 max-w-2xl leading-relaxed font-sans hidden sm:block">
            Bridge the gap between visual intuition and institutional rigor.
            Build, backtest, and stress-test algorithmic strategies with Rust
            speed and a dynamic widget workspace.
          </p>

          {/* Action Buttons */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/lab"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-sans text-xs sm:text-sm font-semibold text-black bg-white hover:bg-zinc-200 light:bg-black light:text-white light:hover:bg-zinc-800 shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <span>Start Backtesting Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-sans text-xs sm:text-sm font-medium text-white light:text-zinc-800 bg-white/[0.06] light:bg-black/5 border border-white/10 light:border-black/10 hover:bg-white/10 light:hover:bg-black/10 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 text-zinc-300 fill-current" />
              <span>Explore Live Demo</span>
            </a>
          </div>
        </motion.div>

        {/* 3D Scroll-Driven Apple MacBook Showcase */}
        <div className="w-full max-w-5xl mx-auto px-4 flex-1 flex items-center justify-center overflow-visible">
          <Laptop3D progress={scrollYProgress} />
        </div>

        {/* Scroll Prompt Micro-Indicator */}
        <motion.div
          style={{ opacity: scrollPromptOpacity }}
          className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-zinc-500 pb-2 select-none"
        >
          <span>Scroll to open terminal</span>
          <ArrowDown className="w-3 h-3 animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
}
