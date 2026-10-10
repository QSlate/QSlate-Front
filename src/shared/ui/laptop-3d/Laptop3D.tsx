'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Gauge,
  Layers,
  LineChart,
  Shield,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

interface Laptop3DProps {
  interactive?: boolean;
}

export function Laptop3D({ interactive = true }: Laptop3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse normalized coordinates [-1, 1]
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      mouseX.set(Math.max(-1, Math.min(1, x)));
      mouseY.set(Math.max(-1, Math.min(1, y)));
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [interactive, mouseX, mouseY]);

  // Subtle 3D tilt following the mouse
  const rotateY = useTransform(smoothMouseX, [-1, 1], [-4, 4]);
  const rotateX = useTransform(smoothMouseY, [-1, 1], [3, -3]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full max-w-[1040px] mx-auto perspective-1200 overflow-visible select-none py-4 px-2 sm:px-4"
    >
      {/* 3D Container Rig */}
      <motion.div
        style={{
          rotateY,
          rotateX,
          transformStyle: 'preserve-3d',
        }}
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full aspect-[16/10.5] sm:aspect-[16/10] flex flex-col items-center"
      >
        {/* Soft Ambient Ground Glow */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[90%] h-24 bg-cyan-500/10 [data-theme=light]:bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none -z-10" />
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[80%] h-12 bg-black/80 blur-2xl rounded-full pointer-events-none -z-10" />

        {/* 1. MacBook Pro Aluminum Frame (Lid & Display) */}
        <div className="relative w-full flex-1 rounded-t-[24px] sm:rounded-t-[32px] rounded-b-md bg-[#16171d] [data-theme=light]:bg-[#d4d6dc] p-[3px] sm:p-[4px] shadow-[0_30px_90px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-white/20 [data-theme=light]:border-black/20 flex flex-col overflow-hidden">
          {/* Inner Black Bezel Frame */}
          <div className="relative w-full h-full rounded-t-[20px] sm:rounded-t-[28px] rounded-b-xs bg-black p-2 sm:p-3 flex flex-col overflow-hidden">
            {/* Camera Notch at Top Center */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-3 sm:h-4 bg-black rounded-b-xl z-40 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#112233] ring-1 ring-white/10 flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-cyan-400/80" />
              </div>
            </div>

            {/* Inner Dashboard Viewport */}
            <div className="relative w-full h-full rounded-lg bg-[#07090e] border border-white/10 overflow-hidden flex flex-row font-sans text-xs">
              {/* Glass Specular Reflection Highlight */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.015] to-white/[0.05] pointer-events-none z-30" />

              {/* A. Left App Sidebar */}
              <div className="w-10 sm:w-12 bg-[#090b11] border-r border-white/5 flex flex-col items-center py-2.5 justify-between shrink-0 select-none z-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-6 h-6 rounded-md overflow-hidden flex items-center justify-center">
                    <Image
                      src="/logo-dark.png"
                      alt="Q"
                      width={24}
                      height={24}
                      className="w-5 h-5 object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-2.5 text-zinc-500">
                    <button
                      type="button"
                      aria-label="Overview Dashboard"
                      className="p-1 rounded text-cyan-400 bg-white/5"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Equity Charts"
                      className="p-1 rounded hover:text-white"
                    >
                      <LineChart className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Risk Engines"
                      className="p-1 rounded hover:text-white"
                    >
                      <Shield className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Execution Telemetry"
                      className="p-1 rounded hover:text-white"
                    >
                      <Gauge className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* B. Main Dashboard Area */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#07090e]">
                {/* Top Toolbar */}
                <div className="h-7 sm:h-8 px-3 bg-[#0a0d14] border-b border-white/5 flex items-center justify-between z-10 select-none text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 text-zinc-300 font-mono text-[9px] sm:text-[10px]">
                      <span>Momentum_ETH_4h.py</span>
                      <span className="px-1 rounded bg-cyan-500/20 text-cyan-400 text-[8px]">
                        4H
                      </span>
                      <span className="text-zinc-500 hidden sm:inline">
                        main · a3f9e1c
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 text-zinc-400">
                    <div className="hidden md:flex items-center gap-1 font-mono text-[9px]">
                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-white">
                        1M
                      </span>
                      <span className="px-1.5 py-0.5">6M</span>
                      <span className="px-1.5 py-0.5">1Y</span>
                      <span className="px-1.5 py-0.5">3Y</span>
                      <span className="px-1.5 py-0.5">5Y</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 hidden lg:inline">
                      2023-01-04 → 2026-01-04
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-semibold border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      SIMULATION COMPLETED
                    </span>
                  </div>
                </div>

                {/* Dashboard Grid: Top Charts + Bottom Editor */}
                <div className="flex-1 p-2 sm:p-3 grid grid-rows-[1.2fr_1fr] gap-2 overflow-hidden bg-black/30">
                  {/* Top Row: Two Charts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-hidden">
                    {/* 1. Equity Curve */}
                    <div className="rounded-lg bg-[#0a0c12] border border-white/5 p-2 sm:p-2.5 flex flex-col justify-between overflow-hidden">
                      <div className="flex items-center justify-between text-[10px]">
                        <div>
                          <span className="font-mono text-zinc-400 block text-[9px]">
                            equity_curve
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                            +29.2%
                            <span className="text-[8px] font-normal text-zinc-500 uppercase tracking-wider">
                              TOTAL RETURN · OUT-OF-SAMPLE
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[8px] font-mono text-zinc-400">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-0.5 bg-cyan-400" /> Strategy
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-0.5 bg-zinc-600 border-b border-dashed" />{' '}
                            SPX
                          </span>
                        </div>
                      </div>

                      {/* Vector SVG Equity Chart */}
                      <div className="relative h-14 sm:h-20 w-full mt-1">
                        <svg
                          viewBox="0 0 300 80"
                          className="w-full h-full overflow-visible"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient
                              id="screenEquityGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#00E5FF"
                                stopOpacity="0.35"
                              />
                              <stop
                                offset="100%"
                                stopColor="#00E5FF"
                                stopOpacity="0.0"
                              />
                            </linearGradient>
                          </defs>
                          {/* SPX Benchmark Dashed Line */}
                          <path
                            d="M0,60 Q50,55 100,58 T180,50 T240,42 T300,38"
                            fill="none"
                            stroke="#52525b"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                          {/* Strategy Equity Area */}
                          <path
                            d="M0,70 Q40,65 80,52 T150,45 T220,24 T300,10 L300,80 L0,80 Z"
                            fill="url(#screenEquityGrad)"
                          />
                          {/* Strategy Equity Stroke */}
                          <path
                            d="M0,70 Q40,65 80,52 T150,45 T220,24 T300,10"
                            fill="none"
                            stroke="#00E5FF"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* 2. Monthly PnL Drawdown */}
                    <div className="rounded-lg bg-[#0a0c12] border border-white/5 p-2 sm:p-2.5 flex flex-col justify-between overflow-hidden">
                      <div className="flex items-center justify-between text-[10px]">
                        <div>
                          <span className="font-mono text-zinc-400 block text-[9px]">
                            monthly_pnl • drawdown
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-rose-400 flex items-center gap-1.5 font-sans">
                            -3.2%
                            <span className="text-[8px] font-normal text-zinc-500 uppercase tracking-wider">
                              WORST MONTH
                            </span>
                          </span>
                        </div>
                        <span className="text-emerald-400 font-mono text-[9px] font-semibold">
                          YTD +9.3%
                        </span>
                      </div>

                      {/* 12 Months Candlestick Bars */}
                      <div className="flex items-end justify-between h-14 sm:h-20 pt-2 px-1 gap-1">
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
                            className="flex-1 flex flex-col items-center justify-end h-full"
                          >
                            <div
                              style={{ height: `${bar.height}%` }}
                              className={`w-full rounded-xs ${
                                bar.neg ? 'bg-rose-500/85' : 'bg-emerald-400/85'
                              }`}
                            />
                            <span className="text-[7px] text-zinc-600 mt-0.5 select-none font-mono">
                              {bar.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Strategy Editor & Console */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 overflow-hidden">
                    {/* Strategy.py Editor (8 cols) */}
                    <div className="sm:col-span-8 rounded-lg bg-[#06070a] border border-white/5 p-2 sm:p-2.5 flex flex-col justify-between overflow-hidden font-mono text-[9px] sm:text-[10px]">
                      <div className="flex items-center justify-between text-zinc-500 pb-1 border-b border-white/5 text-[9px]">
                        <span>strategy.py</span>
                        <span>python 3.12 · sandboxed</span>
                      </div>
                      <div className="leading-relaxed text-zinc-300 mt-1 overflow-hidden">
                        <div>
                          <span className="text-purple-400">from</span>{' '}
                          <span className="text-cyan-400">qslate</span>{' '}
                          <span className="text-purple-400">import</span>{' '}
                          Strategy, signal, risk
                        </div>
                        <div>
                          <span className="text-yellow-400">@risk</span>
                          (max_drawdown=
                          <span className="text-emerald-400">0.10</span>,
                          position_cap=
                          <span className="text-emerald-400">0.25</span>)
                        </div>
                        <div>
                          <span className="text-purple-400">class</span>{' '}
                          <span className="text-yellow-300">MeanReversion</span>
                          (Strategy):
                        </div>
                        <div className="pl-3">
                          <span className="text-purple-400">def</span>{' '}
                          <span className="text-blue-400">on_tick</span>(self,
                          tick):
                        </div>
                        <div className="pl-6 text-zinc-500">
                          # z-score over rolling 200-tick window, no look-ahead
                        </div>
                        <div className="pl-6">
                          z = signal.zscore(tick.mid, window=
                          <span className="text-emerald-400">200</span>)
                        </div>
                        <div className="pl-6">
                          <span className="text-purple-400">if</span> z &lt;{' '}
                          <span className="text-emerald-400">-2.0</span>:{' '}
                          self.buy(size=
                          <span className="text-emerald-400">1</span>)
                        </div>
                        <div className="pl-6">
                          <span className="text-purple-400">elif</span> z &gt;{' '}
                          <span className="text-emerald-400">2.0</span>:{' '}
                          self.flatten()
                        </div>
                      </div>
                    </div>

                    {/* Console & Execution Telemetry (4 cols) */}
                    <div className="sm:col-span-4 rounded-lg bg-[#06070a] border border-white/5 p-2 sm:p-2.5 flex flex-col justify-between overflow-hidden font-mono text-[9px]">
                      <div className="text-zinc-500 pb-1 border-b border-white/5">
                        CONSOLE
                      </div>
                      <div className="space-y-1 my-auto">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>AST validation passed</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Sandbox: gVisor (runsc)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>1.28B ticks in 4.2s</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-300">
                          <Activity className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>3 fills slipped &gt; 1bp</span>
                        </div>
                      </div>
                      <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[8px] text-zinc-500">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          kernel idle
                        </span>
                        <span>rust 1.84</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MacBook Pro Chin & Front Aluminum Lip */}
        <div className="relative w-full h-3 sm:h-4 rounded-b-xl bg-gradient-to-b from-[#1b1d24] via-[#14151a] to-[#0c0d11] [data-theme=light]:from-[#cbd0d8] [data-theme=light]:to-[#9ca3af] border-t border-white/10 [data-theme=light]:border-black/10 shadow-[0_10px_20px_rgba(0,0,0,0.8)] flex items-center justify-center">
          {/* Front Display Thumb Notch */}
          <div className="w-24 sm:w-28 h-1 sm:h-1.5 bg-black/60 rounded-b-md border-b border-white/10" />
        </div>

        {/* 3. Floating 3D Parallax Badges */}
        {/* Chip 1: Sharpe Ratio Badge (Top Right) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, x: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
            y: [0, -6, 0],
          }}
          transition={{
            opacity: { duration: 0.8, delay: 0.3 },
            scale: { duration: 0.8, delay: 0.3 },
            x: { duration: 0.8, delay: 0.3 },
            y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute -top-4 sm:-top-6 -right-2 sm:-right-8 z-50 px-4 py-3 rounded-2xl bg-[#0c0f17]/90 [data-theme=light]:bg-white/95 backdrop-blur-xl border border-white/15 [data-theme=light]:border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col gap-0.5"
        >
          <div className="text-[10px] uppercase tracking-wider text-zinc-400 [data-theme=light]:text-zinc-500 font-mono font-medium">
            Sharpe Ratio
          </div>
          <div className="text-lg sm:text-xl font-bold text-white [data-theme=light]:text-zinc-950 flex items-center gap-2 font-mono">
            2.41{' '}
            <span className="text-xs font-semibold text-rose-400">
              Max DD -8.7%
            </span>
          </div>
        </motion.div>

        {/* Chip 2: Order Execution Fill Badge (Bottom Left) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, x: -20 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
            y: [0, 6, 0],
          }}
          transition={{
            opacity: { duration: 0.8, delay: 0.4 },
            scale: { duration: 0.8, delay: 0.4 },
            x: { duration: 0.8, delay: 0.4 },
            y: {
              duration: 4.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            },
          }}
          className="absolute -bottom-4 sm:-bottom-6 -left-2 sm:-left-8 z-50 px-4 py-3 rounded-2xl bg-[#0c0f17]/90 [data-theme=light]:bg-white/95 backdrop-blur-xl border border-white/15 [data-theme=light]:border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center gap-3.5"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
            <Zap className="w-4 h-4 fill-emerald-400/20" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 [data-theme=light]:text-zinc-500 font-mono font-medium">
              Order Execution Fill
            </div>
            <div className="text-xs sm:text-sm font-bold text-white [data-theme=light]:text-zinc-950 font-mono">
              ES1! BUY 10 @ $5,120.50
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              0.0ms slippage
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
