'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Check, Code2, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { SpotlightCard } from '@/shared/ui/spotlight/SpotlightCard';

export function PersonasBentoSection() {
  return (
    <section
      id="personas"
      className="relative w-full max-w-6xl mx-auto px-4 py-16 sm:py-24"
    >
      {/* Section Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <span className="text-[11px] uppercase tracking-[0.2em] font-sans font-semibold text-zinc-400 [data-theme=light]:text-zinc-500 mb-3">
          For Traders • For Quant Res
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-sans text-white [data-theme=light]:text-zinc-950 tracking-tight leading-tight">
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
            spotlightColor="rgba(0, 255, 178, 0.15)"
            className="p-6 sm:p-8 flex flex-col justify-between h-full bg-[#090b10] [data-theme=light]:bg-[#f8f9fa]"
          >
            <div>
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-sans font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Retail / Pro Traders
                </span>
              </div>

              <h3 className="text-2xl font-bold font-sans text-white [data-theme=light]:text-zinc-950 tracking-tight">
                For Intuitive Traders
              </h3>
              <p className="mt-3 text-sm text-zinc-400 [data-theme=light]:text-zinc-600 leading-relaxed font-sans">
                Describe an idea in plain English and watch it become a rigorous
                backtested strategy. No code, no spreadsheets.
              </p>

              {/* Feature Checklist */}
              <ul className="mt-6 space-y-3 font-sans text-xs text-zinc-300 [data-theme=light]:text-zinc-700">
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>Natural language strategy builder</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>Zero-code backtests in seconds</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>Visual risk explanation on every trade</span>
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
                    <span className="ml-1 font-semibold text-zinc-300 [data-theme=light]:text-zinc-700 font-sans">
                      PROMPT
                    </span>
                  </div>
                  <span className="text-emerald-400 font-sans">AI KERNEL</span>
                </div>
                <div className="p-4 font-mono text-xs text-emerald-400">
                  <span>
                    &gt; &quot;Buy SPY when RSI dips below 30, exit at +4%&quot;
                  </span>
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="mt-6 flex items-center">
                <Link
                  href="/lab"
                  className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group"
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
            spotlightColor="rgba(0, 229, 255, 0.15)"
            className="p-6 sm:p-8 flex flex-col justify-between h-full bg-[#090b10] [data-theme=light]:bg-[#f8f9fa]"
          >
            <div>
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-sans font-semibold uppercase tracking-wider">
                  <Code2 className="w-3 h-3 text-cyan-400" />
                  Quant / Hedge Fund
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
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>Raw tick-level orderbook data</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>Custom Numba/Cuda optimization</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>AST security validation on every deploy</span>
                </li>
              </ul>
            </div>

            {/* Python AST Snippet Window */}
            <div className="mt-8">
              <div className="rounded-xl bg-[#06070a] [data-theme=light]:bg-white border border-white/10 [data-theme=light]:border-black/10 overflow-hidden shadow-inner">
                <div className="px-3.5 py-2 bg-[#0c0e14] [data-theme=light]:bg-[#f1f3f5] border-b border-white/5 [data-theme=light]:border-black/5 flex items-center justify-between font-mono text-[10px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/80" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                    <div className="w-2 h-2 rounded-full bg-green-500/80" />
                    <span className="ml-1 font-semibold text-zinc-300 [data-theme=light]:text-zinc-700 font-sans">
                      PYTHON
                    </span>
                  </div>
                  <span className="text-cyan-400 font-sans">RUST ENGINE</span>
                </div>
                <div className="p-4 font-mono text-xs text-cyan-400">
                  <span>
                    &gt; update_regime_vol(tick, 0.05) | compile_sim()
                  </span>
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="mt-6 flex items-center">
                <Link
                  href="#docs"
                  className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-cyan-400 hover:text-cyan-300 transition-colors group"
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
