'use client';

import { motion } from 'framer-motion';
import { Activity, CheckCircle2, Cpu, GripVertical, Plus } from 'lucide-react';

export function ModularDeskSection() {
  return (
    <section
      id="features"
      className="relative w-full max-w-5xl mx-auto px-4 py-20 sm:py-28"
    >
      {/* Section Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase text-zinc-400 [data-theme=light]:text-zinc-600 bg-white/[0.04] [data-theme=light]:bg-black/5 border border-white/10 [data-theme=light]:border-black/10 mb-4 select-none">
          THE MODULAR LAB
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-[54px] font-bold font-sans text-white [data-theme=light]:text-zinc-950 tracking-tight leading-[1.12]">
          Your research desk,
          <br />
          composed widget by widget.
        </h2>

        <p className="mt-5 text-sm sm:text-base text-zinc-400 [data-theme=light]:text-zinc-600 leading-relaxed max-w-2xl font-sans">
          Drag, dock, and wire together analytics panels. Every widget streams
          from the same deterministic simulation, so what you see is exactly
          what the kernel computed.
        </p>
      </div>

      {/* Interactive Workspace Showcase Replica */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl bg-[#07090e] [data-theme=light]:bg-[#f8f9fa] border border-white/10 [data-theme=light]:border-black/10 shadow-[0_30px_90px_rgba(0,0,0,0.6)] [data-theme=light]:shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden"
      >
        {/* Workspace Top Toolbar */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#0a0c12] [data-theme=light]:bg-white border-b border-white/10 [data-theme=light]:border-black/5 flex flex-wrap items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono">
              <GripVertical className="w-4 h-4 text-zinc-600 cursor-grab" />
              <span className="text-zinc-400 font-sans">workspace</span>
              <span className="text-zinc-600">/</span>
              <span className="font-semibold text-white [data-theme=light]:text-zinc-900 font-mono">
                mean-reversion-v4
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] text-zinc-400 border border-white/5 text-[10px] tracking-wider uppercase">
              3 WIDGETS · SYNCED
            </span>

            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 [data-theme=light]:bg-black/5 border border-white/10 [data-theme=light]:border-black/10 text-zinc-300 [data-theme=light]:text-zinc-700 hover:text-white [data-theme=light]:hover:text-black hover:bg-white/10 transition-colors font-sans text-xs"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" />
              <span>Add widget</span>
            </button>
          </div>
        </div>

        {/* Workspace Widgets Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-[#07090e] [data-theme=light]:bg-[#f4f5f8]">
          {/* Widget 1: Equity Curve (Spans 7 cols on LG) */}
          <div className="lg:col-span-7 rounded-xl bg-[#090b10] [data-theme=light]:bg-white border border-white/10 [data-theme=light]:border-black/5 p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            {/* Widget Titlebar */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5 [data-theme=light]:border-black/5">
              <div className="flex items-center gap-2 font-mono text-xs">
                <GripVertical className="w-3.5 h-3.5 text-zinc-600 cursor-grab" />
                <span className="font-medium text-zinc-300 [data-theme=light]:text-zinc-800">
                  Equity Curve
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                NAV · USD
              </span>
            </div>

            {/* Metric Header */}
            <div className="flex items-center justify-between mt-3">
              <div>
                <span className="text-xl sm:text-2xl font-bold text-white [data-theme=light]:text-zinc-950 font-sans">
                  +29.2%
                </span>
                <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-mono">
                  TOTAL RETURN · OUT-OF-SAMPLE
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-cyan-400" /> Strategy
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-zinc-600 border-b border-dashed" />{' '}
                  SPX
                </span>
              </div>
            </div>

            {/* Interactive SVG Chart Canvas */}
            <div className="relative w-full h-44 sm:h-52 mt-4">
              <svg
                viewBox="0 0 400 160"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="deskEquityGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* SPX Dashed Line */}
                <path
                  d="M0,120 Q60,110 120,115 T240,90 T320,80 T400,70"
                  fill="none"
                  stroke="#52525b"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                {/* Strategy Fill */}
                <path
                  d="M0,135 Q50,130 90,110 T180,95 T260,65 T340,35 T400,15 L400,160 L0,160 Z"
                  fill="url(#deskEquityGrad)"
                />
                {/* Strategy Stroke */}
                <path
                  d="M0,135 Q50,130 90,110 T180,95 T260,65 T340,35 T400,15"
                  fill="none"
                  stroke="#00E5FF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Widget 2: Drawdown Waterfall (Spans 5 cols on LG) */}
          <div className="lg:col-span-5 rounded-xl bg-[#090b10] [data-theme=light]:bg-white border border-white/10 [data-theme=light]:border-black/5 p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 [data-theme=light]:border-black/5">
              <div className="flex items-center gap-2 font-mono text-xs">
                <GripVertical className="w-3.5 h-3.5 text-zinc-600 cursor-grab" />
                <span className="font-medium text-zinc-300 [data-theme=light]:text-zinc-800">
                  Drawdown Waterfall
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                MONTHLY
              </span>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div>
                <span className="text-xl sm:text-2xl font-bold text-rose-400 font-sans">
                  -3.2%
                </span>
                <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-mono">
                  WORST MONTH
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-400">
                YTD +9.3%
              </span>
            </div>

            {/* 12 Monthly Candlestick Bars */}
            <div className="flex items-end justify-between h-44 sm:h-52 pt-6 px-1 gap-1.5">
              {[
                { height: 35, neg: false, label: 'J' },
                { height: 25, neg: true, label: 'F' },
                { height: 50, neg: true, label: 'M' },
                { height: 60, neg: false, label: 'A' },
                { height: 75, neg: false, label: 'M' },
                { height: 40, neg: false, label: 'J' },
                { height: 20, neg: true, label: 'J' },
                { height: 65, neg: false, label: 'A' },
                { height: 35, neg: true, label: 'S' },
                { height: 85, neg: false, label: 'O' },
                { height: 95, neg: false, label: 'N' },
                { height: 45, neg: false, label: 'D' },
              ].map((bar, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  <div
                    style={{ height: `${bar.height}%` }}
                    className={`w-full rounded-xs transition-transform group-hover:scale-105 ${
                      bar.neg
                        ? 'bg-rose-500/85 [data-theme=light]:bg-rose-500'
                        : 'bg-emerald-400/85 [data-theme=light]:bg-emerald-500'
                    }`}
                  />
                  <span className="text-[8px] text-zinc-600 mt-1 select-none font-mono">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 3: Python Strategy Code & Console (Spans all 12 cols) */}
          <div className="lg:col-span-12 rounded-xl bg-[#090b10] [data-theme=light]:bg-white border border-white/10 [data-theme=light]:border-black/5 overflow-hidden shadow-lg grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/5 [data-theme=light]:divide-black/5">
            {/* Left 8 Cols: Code Editor */}
            <div className="lg:col-span-8 p-4 sm:p-5 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 [data-theme=light]:border-black/5 text-[11px] text-zinc-500">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-3.5 h-3.5 text-zinc-600 cursor-grab" />
                  <span className="text-zinc-300 [data-theme=light]:text-zinc-800">
                    strategy.py
                  </span>
                </div>
                <span>PYTHON 3.12</span>
              </div>

              <div className="mt-3 space-y-1 text-zinc-300 [data-theme=light]:text-zinc-800 leading-relaxed text-[11px]">
                <div className="flex gap-4">
                  <span className="text-zinc-600 select-none w-6 text-right">
                    1
                  </span>
                  <span>
                    <span className="text-purple-400">from</span>{' '}
                    <span className="text-cyan-400">qslate</span>{' '}
                    <span className="text-purple-400">import</span> Strategy,
                    signal, risk
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-600 select-none w-6 text-right">
                    2
                  </span>
                  <span />
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-600 select-none w-6 text-right">
                    3
                  </span>
                  <span>
                    <span className="text-yellow-400">@risk</span>(max_drawdown=
                    <span className="text-emerald-400">0.10</span>,
                    position_cap=
                    <span className="text-emerald-400">0.25</span>)
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-600 select-none w-6 text-right">
                    4
                  </span>
                  <span>
                    <span className="text-purple-400">class</span>{' '}
                    <span className="text-yellow-300">MeanReversion</span>
                    (Strategy):
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-600 select-none w-6 text-right">
                    5
                  </span>
                  <span className="pl-6">
                    universe ={' '}
                    <span className="text-emerald-400">&quot;ES1!&quot;</span>
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-600 select-none w-6 text-right">
                    6
                  </span>
                  <span />
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-600 select-none w-6 text-right">
                    7
                  </span>
                  <span className="pl-6">
                    <span className="text-purple-400">def</span>{' '}
                    <span className="text-blue-400">on_tick</span>(self, tick):
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-600 select-none w-6 text-right">
                    8
                  </span>
                  <span className="pl-12 text-zinc-500">
                    # z-score over rolling 200-tick window, no look-ahead
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-600 select-none w-6 text-right">
                    9
                  </span>
                  <span className="pl-12">
                    z = signal.zscore(tick.mid, window=
                    <span className="text-emerald-400">200</span>)
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-600 select-none w-6 text-right">
                    10
                  </span>
                  <span className="pl-12">
                    <span className="text-purple-400">if</span> z &lt;{' '}
                    <span className="text-emerald-400">-2.0</span>:
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-600 select-none w-6 text-right">
                    11
                  </span>
                  <span className="pl-16">
                    self.buy(size=
                    <span className="text-emerald-400">1</span>)
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-600 select-none w-6 text-right">
                    12
                  </span>
                  <span className="pl-12">
                    <span className="text-purple-400">elif</span> z &gt;{' '}
                    <span className="text-emerald-400">2.0</span>:
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-600 select-none w-6 text-right">
                    13
                  </span>
                  <span className="pl-16">self.flatten()</span>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Console Telemetry */}
            <div className="lg:col-span-4 p-4 sm:p-5 font-mono text-xs flex flex-col justify-between">
              <div>
                <div className="text-zinc-500 pb-3 border-b border-white/5 [data-theme=light]:border-black/5 text-[11px]">
                  CONSOLE
                </div>
                <div className="space-y-2 mt-4 text-[11px]">
                  <div className="flex items-center gap-2 text-zinc-300 [data-theme=light]:text-zinc-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>AST validation passed</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300 [data-theme=light]:text-zinc-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Sandbox: gVisor (runsc)</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300 [data-theme=light]:text-zinc-800">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>1.28B ticks in 4.2s</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-300">
                    <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>3 fills slipped &gt; 1bp</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 [data-theme=light]:border-black/5 flex items-center justify-between text-[10px] text-zinc-500">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  kernel idle
                </span>
                <span>rust 1.84</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
