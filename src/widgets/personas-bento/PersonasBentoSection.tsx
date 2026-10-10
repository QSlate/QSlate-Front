'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { SpotlightCard } from '@/shared/ui/spotlight/SpotlightCard';

export function PersonasBentoSection() {
  return (
    <section
      id="marketplace"
      className="relative w-full max-w-5xl mx-auto px-4 py-20 sm:py-28"
    >
      {/* Section Header */}
      <div className="flex flex-col items-start mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase text-zinc-400 [data-theme=light]:text-zinc-600 bg-white/[0.04] [data-theme=light]:bg-black/5 border border-white/10 [data-theme=light]:border-black/10 mb-4 select-none">
          ONE ENGINE, TWO COCKPITS
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-[54px] font-bold font-sans text-white [data-theme=light]:text-zinc-950 tracking-tight leading-[1.12]">
          Built for how you
          <br />
          think about markets.
        </h2>
      </div>

      {/* Side-by-Side Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card A: For Intuitive Traders */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="h-full"
        >
          <SpotlightCard
            spotlightColor="rgba(0, 255, 178, 0.12)"
            className="p-6 sm:p-8 flex flex-col justify-between h-full bg-[#090b10] [data-theme=light]:bg-[#f8f9fa] border border-white/10 [data-theme=light]:border-black/10 rounded-2xl shadow-xl"
          >
            <div>
              {/* Badge */}
              <div className="flex items-center justify-between mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] text-zinc-300 [data-theme=light]:text-zinc-700 border border-white/10 [data-theme=light]:border-black/10 text-[10px] font-mono uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-zinc-400" />
                  RETAIL · DISCRETIONARY
                </span>
              </div>

              <h3 className="text-2xl font-bold font-sans text-white [data-theme=light]:text-zinc-950 tracking-tight">
                For Intuitive Traders
              </h3>
              <p className="mt-3 text-sm text-zinc-400 [data-theme=light]:text-zinc-600 leading-relaxed font-sans">
                Describe an idea in plain English and watch it become a
                rigorously tested strategy. No code, no spreadsheets.
              </p>

              {/* Feature Checklist */}
              <ul className="mt-6 space-y-3 font-sans text-xs text-zinc-300 [data-theme=light]:text-zinc-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>Natural language strategy builder</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>Zero-code backtests in one click</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>Visual risk explanations for every trade</span>
                </li>
              </ul>
            </div>

            {/* Prompt Window Replica */}
            <div className="mt-8">
              <div className="rounded-xl bg-[#06070a] [data-theme=light]:bg-white border border-white/10 [data-theme=light]:border-black/10 overflow-hidden shadow-inner">
                <div className="px-3.5 py-2 bg-[#0c0e14] [data-theme=light]:bg-[#f1f3f5] border-b border-white/5 [data-theme=light]:border-black/5 flex items-center justify-between font-mono text-[10px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/80" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                    <div className="w-2 h-2 rounded-full bg-green-500/80" />
                    <span className="ml-1.5 font-semibold text-zinc-400 font-sans text-[9px] uppercase tracking-wider">
                      PROMPT
                    </span>
                  </div>
                </div>
                <div className="p-4 font-mono text-xs text-amber-300 [data-theme=light]:text-amber-600 flex items-center">
                  <span>
                    &gt; &quot;Buy SPY when RSI dips below 30, exit at +4%&quot;
                  </span>
                  <span className="w-1.5 h-3.5 bg-white ml-1 inline-block animate-pulse" />
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="mt-6 flex items-center">
                <Link
                  href="/lab"
                  className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-zinc-300 [data-theme=light]:text-zinc-700 hover:text-white [data-theme=light]:hover:text-black transition-colors group"
                >
                  <span>Start building</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Card B: For Researchers */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="h-full"
        >
          <SpotlightCard
            spotlightColor="rgba(0, 229, 255, 0.12)"
            className="p-6 sm:p-8 flex flex-col justify-between h-full bg-[#090b10] [data-theme=light]:bg-[#f8f9fa] border border-white/10 [data-theme=light]:border-black/10 rounded-2xl shadow-xl"
          >
            <div>
              {/* Badge */}
              <div className="flex items-center justify-between mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] text-zinc-300 [data-theme=light]:text-zinc-700 border border-white/10 [data-theme=light]:border-black/10 text-[10px] font-mono uppercase tracking-wider">
                  <ChevronRight className="w-3 h-3 text-zinc-400" />
                  QUANT · HEDGE FUND
                </span>
              </div>

              <h3 className="text-2xl font-bold font-sans text-white [data-theme=light]:text-zinc-950 tracking-tight">
                For Researchers
              </h3>
              <p className="mt-3 text-sm text-zinc-400 [data-theme=light]:text-zinc-600 leading-relaxed font-sans">
                Institutional-grade infrastructure with the controls you expect:
                raw data, reproducible runs, and audited execution.
              </p>

              {/* Feature Checklist */}
              <ul className="mt-6 space-y-3 font-sans text-xs text-zinc-300 [data-theme=light]:text-zinc-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>Raw tick-level order book data</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>Custom Monte Carlo optimization</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>AST security validation on every deploy</span>
                </li>
              </ul>
            </div>

            {/* Terminal Snippet Window */}
            <div className="mt-8">
              <div className="rounded-xl bg-[#06070a] [data-theme=light]:bg-white border border-white/10 [data-theme=light]:border-black/10 overflow-hidden shadow-inner">
                <div className="px-3.5 py-2 bg-[#0c0e14] [data-theme=light]:bg-[#f1f3f5] border-b border-white/5 [data-theme=light]:border-black/5 flex items-center justify-between font-mono text-[10px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/80" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                    <div className="w-2 h-2 rounded-full bg-green-500/80" />
                    <span className="ml-1.5 font-semibold text-zinc-400 font-sans text-[9px] uppercase tracking-wider">
                      ZSH
                    </span>
                  </div>
                </div>
                <div className="p-4 font-mono text-xs text-cyan-400 flex items-center">
                  <span>$ qslate run --mc 10000 --book L2 --seed 42</span>
                  <span className="w-1.5 h-3.5 bg-white ml-1 inline-block animate-pulse" />
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="mt-6 flex items-center">
                <Link
                  href="#docs"
                  className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-zinc-300 [data-theme=light]:text-zinc-700 hover:text-white [data-theme=light]:hover:text-black transition-colors group"
                >
                  <span>Read the docs</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>
    </section>
  );
}
