'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  Code2,
  GripHorizontal,
  Maximize2,
  Plus,
  Terminal,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

export function ModularDeskSection() {
  const [activeTab, setActiveTab] = useState<'strategy' | 'output'>('strategy');

  return (
    <section
      id="features"
      className="relative w-full max-w-6xl mx-auto px-4 py-20 sm:py-32"
    >
      {/* Section Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-14">
        <span className="text-[11px] uppercase tracking-[0.25em] font-mono font-semibold text-cyan-400 mb-3">
          The Modular Lab
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-mono text-white [data-theme=light]:text-zinc-950 tracking-tight leading-tight">
          Your research desk,{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            composed widget by widget.
          </span>
        </h2>
        <p className="mt-4 text-sm sm:text-base text-zinc-400 [data-theme=light]:text-zinc-600 leading-relaxed max-w-2xl">
          Snap, dock, and wire together analytics panels. Every widget streams
          from the same deterministic simulation, so what you see is exactly
          what the kernel computed.
        </p>
      </div>

      {/* Interactive Workspace Showcase Replica */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl bg-[#07080b] [data-theme=light]:bg-[#f8f9fa] border border-white/10 [data-theme=light]:border-black/10 shadow-[0_30px_90px_rgba(0,0,0,0.6)] [data-theme=light]:shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden"
      >
        {/* Workspace Top Toolbar */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#0d0f14] [data-theme=light]:bg-white border-b border-white/10 [data-theme=light]:border-black/5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
            </div>
            <div className="h-4 w-[1px] bg-white/10 [data-theme=light]:bg-black/10 mx-1" />
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="font-semibold text-white [data-theme=light]:text-zinc-900">
                BACKTEST
              </span>
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-400 [data-theme=light]:text-zinc-600">
                2021-2024 TICK
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              TICK FEED: 1,420,800 MSG/S
            </span>

            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 [data-theme=light]:bg-black/5 border border-white/10 [data-theme=light]:border-black/10 text-zinc-300 [data-theme=light]:text-zinc-700 hover:text-white [data-theme=light]:hover:text-black hover:bg-white/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Widget</span>
            </button>
          </div>
        </div>

        {/* Workspace Widgets Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Widget 1: Equity Curve (Spans 7 cols on LG) */}
          <div className="lg:col-span-7 rounded-xl bg-[#0b0d12] [data-theme=light]:bg-white border border-white/10 [data-theme=light]:border-black/5 p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            {/* Widget Titlebar */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5 [data-theme=light]:border-black/5">
              <div className="flex items-center gap-2 font-mono">
                <GripHorizontal className="w-4 h-4 text-zinc-600 cursor-grab" />
                <span className="text-xs font-semibold text-zinc-300 [data-theme=light]:text-zinc-800 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  Equity Curve
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-emerald-400 font-bold">+29.24%</span>
                <Maximize2 className="w-3.5 h-3.5 text-zinc-500 hover:text-white transition-colors cursor-pointer" />
              </div>
            </div>

            {/* Interactive SVG Chart Canvas */}
            <div className="relative w-full h-48 sm:h-56 mt-4">
              <svg
                viewBox="0 0 400 160"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="mainEquityGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal reference lines */}
                <line
                  x1="0"
                  y1="40"
                  x2="400"
                  y2="40"
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  className="text-white/5 [data-theme=light]:text-black/5"
                />
                <line
                  x1="0"
                  y1="80"
                  x2="400"
                  y2="80"
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  className="text-white/5 [data-theme=light]:text-black/5"
                />
                <line
                  x1="0"
                  y1="120"
                  x2="400"
                  y2="120"
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  className="text-white/5 [data-theme=light]:text-black/5"
                />

                {/* Filled Gradient Area */}
                <path
                  d="M0,135 Q50,130 90,110 T180,95 T260,65 T340,35 T400,15 L400,160 L0,160 Z"
                  fill="url(#mainEquityGrad)"
                />
                {/* Accent Line */}
                <path
                  d="M0,135 Q50,130 90,110 T180,95 T260,65 T340,35 T400,15"
                  fill="none"
                  stroke="#00E5FF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Quick Summary Pill Row */}
            <div className="mt-4 pt-3 border-t border-white/5 [data-theme=light]:border-black/5 grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div>
                <span className="text-zinc-500 block">FINAL BALANCE</span>
                <span className="text-white [data-theme=light]:text-zinc-900 font-bold">
                  $129,240.00
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">SHARPE RATIO</span>
                <span className="text-cyan-400 font-bold">2.41</span>
              </div>
              <div>
                <span className="text-zinc-500 block">MAX DRAWDOWN</span>
                <span className="text-rose-400 font-bold">-3.2%</span>
              </div>
            </div>
          </div>

          {/* Widget 2: Drawdown Waterfall (Spans 5 cols on LG) */}
          <div className="lg:col-span-5 rounded-xl bg-[#0b0d12] [data-theme=light]:bg-white border border-white/10 [data-theme=light]:border-black/5 p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 [data-theme=light]:border-black/5">
              <div className="flex items-center gap-2 font-mono">
                <GripHorizontal className="w-4 h-4 text-zinc-600 cursor-grab" />
                <span className="text-xs font-semibold text-zinc-300 [data-theme=light]:text-zinc-800 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-400" />
                  Drawdown Waterfall
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400">
                -3.2% MAX
              </span>
            </div>

            {/* Candlestick & Volume Bars */}
            <div className="flex items-end justify-between h-48 sm:h-56 pt-6 px-2 gap-1.5">
              {[25, 45, 30, 60, 55, 80, 40, 70, 90, 65, 85, 100, 75, 95].map(
                (height, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    <div
                      style={{ height: `${height}%` }}
                      className={`w-full rounded-xs transition-transform group-hover:scale-105 ${
                        i % 4 === 1
                          ? 'bg-rose-500/80 [data-theme=light]:bg-rose-500'
                          : 'bg-emerald-400/80 [data-theme=light]:bg-emerald-500'
                      }`}
                    />
                  </div>
                )
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 [data-theme=light]:border-black/5 flex items-center justify-between font-mono text-[11px] text-zinc-500">
              <span>VOLATILITY REGIME: LOW</span>
              <span className="text-emerald-400">AUDITED HISTORICAL</span>
            </div>
          </div>

          {/* Widget 3: Python Mini IDE (Spans all 12 cols) */}
          <div className="lg:col-span-12 rounded-xl bg-[#090b10] [data-theme=light]:bg-white border border-white/10 [data-theme=light]:border-black/5 overflow-hidden shadow-lg">
            {/* Editor Top Bar with Tabs */}
            <div className="px-4 py-2.5 bg-[#0d0f14] [data-theme=light]:bg-zinc-100 border-b border-white/10 [data-theme=light]:border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('strategy')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                    activeTab === 'strategy'
                      ? 'bg-white/10 [data-theme=light]:bg-white text-white [data-theme=light]:text-black font-semibold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>strategy.py</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('output')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                    activeTab === 'output'
                      ? 'bg-white/10 [data-theme=light]:bg-white text-white [data-theme=light]:text-black font-semibold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>sim_telemetry.log</span>
                </button>
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
                <span className="hidden sm:inline">
                  AST Security Check: PASS
                </span>
                <span className="text-emerald-400">● Python 3.12 (SIMD)</span>
              </div>
            </div>

            {/* Code Content Area */}
            <div className="p-4 sm:p-5 font-mono text-xs leading-relaxed overflow-x-auto bg-[#07080b] [data-theme=light]:bg-[#fafafa]">
              {activeTab === 'strategy' ? (
                <div className="space-y-1 text-zinc-300 [data-theme=light]:text-zinc-800">
                  <div className="flex gap-4">
                    <span className="text-zinc-600 select-none w-6 text-right">
                      1
                    </span>
                    <span>
                      <span className="text-purple-400">from</span>{' '}
                      <span className="text-cyan-400">qslate.kernel</span>{' '}
                      <span className="text-purple-400">import</span> Strategy,
                      Alpha, RiskEngine
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-zinc-600 select-none w-6 text-right">
                      2
                    </span>
                    <span>
                      <span className="text-yellow-400">@strategy</span>(mode=
                      <span className="text-emerald-400">&quot;tick&quot;</span>
                      , engine=
                      <span className="text-emerald-400">
                        &quot;rust_polars&quot;
                      </span>
                      )
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-zinc-600 select-none w-6 text-right">
                      3
                    </span>
                    <span>
                      <span className="text-purple-400">class</span>{' '}
                      <span className="text-yellow-300">
                        MeanReversionAlpha
                      </span>
                      (Strategy):
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-zinc-600 select-none w-6 text-right">
                      4
                    </span>
                    <span className="pl-6">
                      <span className="text-purple-400">def</span>{' '}
                      <span className="text-blue-400">on_market_tick</span>
                      (self, tick: Tick):
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-zinc-600 select-none w-6 text-right">
                      5
                    </span>
                    <span className="pl-12 text-zinc-500">
                      # Vectorized trigger evaluated in 8ms P99
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-zinc-600 select-none w-6 text-right">
                      6
                    </span>
                    <span className="pl-12">
                      <span className="text-purple-400">if</span> tick.rsi_4h
                      &lt; <span className="text-emerald-400">30.0</span>{' '}
                      <span className="text-purple-400">and</span>{' '}
                      tick.spread_bps &lt;={' '}
                      <span className="text-emerald-400">1.2</span>:
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-zinc-600 select-none w-6 text-right">
                      7
                    </span>
                    <span className="pl-16">
                      self.rebalance(target_weight=
                      <span className="text-emerald-400">0.25</span>,
                      stop_loss_pct=
                      <span className="text-emerald-400">0.02</span>)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-emerald-400 font-mono text-[11px]">
                  <div>
                    [KERNEL] Ingesting 1,420,800 ticks from TimescaleDB Parquet
                    cache...
                  </div>
                  <div>
                    [SIMD] Vectorized array buffers allocated (Apache Arrow
                    zero-copy)
                  </div>
                  <div>
                    [EXEC] Iteration complete: 3Y historical backtest finished
                    in 284ms.
                  </div>
                  <div className="text-cyan-400">
                    [RESULT] Total Trades: 842 | Sharpe: 2.41 | Max Drawdown:
                    -3.20%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
