'use client';

import { ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';

import { DeviceShowcase } from '@/shared/ui/device-showcase/DeviceShowcase';

export function LandingHero() {
  return (
    <DeviceShowcase
      intro={
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Eyebrow Pill */}
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-mono font-medium tracking-[0.2em] uppercase text-zinc-300 light:text-zinc-600 bg-[#0d1117] light:bg-black/5 border border-white/10 light:border-black/10 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-gain" />
            <span>Backtesting • Simulation • Risk</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[68px] font-bold tracking-tight max-w-4xl leading-[1.08] font-sans text-white light:text-zinc-950">
            <span className="block">The Flight Simulator for</span>
            <span className="block">Quantitative Finance.</span>
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
        </div>
      }
    />
  );
}
