'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Check, Code2, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { SpotlightCard } from '@/shared/ui/spotlight/SpotlightCard';

export function PersonasBentoSection() {
  return (
    <section
      id="personas"
      className="relative w-full max-w-6xl mx-auto px-4 py-20 sm:py-32"
    >
      {/* Section Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-14">
        <span className="text-[11px] uppercase tracking-[0.25em] font-mono font-semibold text-cyan-400 mb-3">
          For Traders • For Quants
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-mono text-white [data-theme=light]:text-zinc-950 tracking-tight leading-tight">
          Built for how you{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            think about markets.
          </span>
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
            className="p-6 sm:p-8 flex flex-col justify-between h-full"
          >
            <div>
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Retail / No-Code
                </span>
              </div>

              <h3 className="text-2xl font-bold font-mono text-white [data-theme=light]:text-zinc-900 tracking-tight">
                For Intuitive Traders
              </h3>
              <p className="mt-3 text-sm text-zinc-400 [data-theme=light]:text-zinc-600 leading-relaxed font-sans">
                Describe an idea in plain English and watch it become a rigorous
                backtest strategy. No code, no spreadsheets.
              </p>

              {/* Feature Checklist */}
              <ul className="mt-6 space-y-3 font-mono text-xs text-zinc-300 [data-theme=light]:text-zinc-700">
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
                  <span>Zero look-ahead bias in simulation</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>Visual risk explanation & factor radar</span>
                </li>
              </ul>
            </div>

            {/* Prompt Window Replica */}
            <div className="mt-8">
              <div className="rounded-xl bg-[#06070a] [data-theme=light]:bg-[#f4f5f7] border border-white/10 [data-theme=light]:border-black/5 overflow-hidden">
                <div className="px-3.5 py-2 bg-[#0c0e14] [data-theme=light]:bg-[#e9ecef] border-b border-white/5 [data-theme=light]:border-black/5 flex items-center justify-between font-mono text-[10px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/80" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                    <div className="w-2 h-2 rounded-full bg-green-500/80" />
                    <span className="ml-1 font-semibold text-zinc-300 [data-theme=light]:text-zinc-700">
                      PROMPT
                    </span>
                  </div>
                  <span className="text-emerald-400">AI KERNEL</span>
                </div>
                <div className="p-4 font-mono text-xs text-emerald-400">
                  <span>
                    &gt; &quot;Buy ETH when 4h RSI falls below 30, with a 2%
                    trailing stop&quot;
                  </span>
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="mt-6 flex items-center">
                <Link
                  href="/lab"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group"
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
            className="p-6 sm:p-8 flex flex-col justify-between h-full"
          >
            <div>
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-semibold uppercase tracking-wider">
                  <Code2 className="w-3 h-3 text-cyan-400" />
                  Quant / Python / Rust
                </span>
              </div>

              <h3 className="text-2xl font-bold font-mono text-white [data-theme=light]:text-zinc-900 tracking-tight">
                For Researchers
              </h3>
              <p className="mt-3 text-sm text-zinc-400 [data-theme=light]:text-zinc-600 leading-relaxed font-sans">
                Institutional-grade infrastructure with the controls you expect:
                raw data, reproducible runs, and audited execution.
              </p>

              {/* Feature Checklist */}
              <ul className="mt-6 space-y-3 font-mono text-xs text-zinc-300 [data-theme=light]:text-zinc-700">
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>Raw tick-level order flow data</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>Custom Monte Carlo optimization</span>
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
              <div className="rounded-xl bg-[#06070a] [data-theme=light]:bg-[#f4f5f7] border border-white/10 [data-theme=light]:border-black/5 overflow-hidden">
                <div className="px-3.5 py-2 bg-[#0c0e14] [data-theme=light]:bg-[#e9ecef] border-b border-white/5 [data-theme=light]:border-black/5 flex items-center justify-between font-mono text-[10px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/80" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                    <div className="w-2 h-2 rounded-full bg-green-500/80" />
                    <span className="ml-1 font-semibold text-zinc-300 [data-theme=light]:text-zinc-700">
                      PYTHON
                    </span>
                  </div>
                  <span className="text-cyan-400">RUST ENGINE</span>
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
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-cyan-400 hover:text-cyan-300 transition-colors group"
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
