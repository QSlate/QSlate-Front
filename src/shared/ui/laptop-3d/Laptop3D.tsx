'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Activity, ArrowUpRight, TrendingUp, Zap } from 'lucide-react';
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

  // Mouse parallax rotation
  const mouseYaw = useTransform(smoothMouseX, [-1, 1], [-5, 5]);
  const mousePitch = useTransform(smoothMouseY, [-1, 1], [4, -4]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full min-h-[520px] sm:min-h-[640px] lg:min-h-[720px] perspective-1200 overflow-visible select-none py-6"
    >
      {/* 3D Chassis Rig */}
      <motion.div
        style={{
          rotateY: mouseYaw,
          rotateX: mousePitch,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-[340px] sm:w-[600px] md:w-[780px] lg:w-[940px] xl:w-[980px] aspect-[16/10] flex items-end justify-center"
      >
        {/* Soft Ambient Ground Reflection */}
        <div className="absolute -bottom-12 w-[85%] h-[120px] bg-cyan-500/15 [data-theme=light]:bg-cyan-500/5 blur-[90px] rounded-full pointer-events-none -z-10" />
        <div className="absolute -bottom-8 w-[70%] h-[80px] bg-black/60 blur-[40px] rounded-full pointer-events-none -z-10" />

        {/* 1. Base Deck (Bottom Aluminum Chassis) */}
        <motion.div
          initial={{ rotateX: 38, y: 30, opacity: 0 }}
          animate={{ rotateX: 20, y: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'bottom center',
          }}
          className="relative w-full h-[50%] rounded-b-2xl rounded-t-sm bg-gradient-to-b from-[#22252e] via-[#15171e] to-[#0c0d12] [data-theme=light]:from-[#e5e7eb] [data-theme=light]:via-[#d1d5db] [data-theme=light]:to-[#9ca3af] border border-white/20 [data-theme=light]:border-black/20 shadow-[0_30px_70px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-col justify-between p-2 sm:p-3"
        >
          {/* Front thumb notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-1.5 sm:h-2 bg-black/70 rounded-b-md border-b border-white/10" />

          {/* Keyboard deck recess */}
          <div className="mx-auto mt-3 sm:mt-4 w-[90%] h-[68%] rounded-lg bg-[#07080b] [data-theme=light]:bg-[#181a20] border border-white/5 p-1.5 sm:p-2 shadow-inner flex flex-col justify-between">
            {/* Chiclet keys rows */}
            <div className="w-full h-full grid grid-rows-5 gap-0.5 sm:gap-1 opacity-80">
              {[14, 14, 13, 12, 9].map((cols, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex gap-0.5 sm:gap-1 justify-center h-full"
                >
                  {Array.from({ length: cols }).map((_, colIndex) => (
                    <div
                      key={colIndex}
                      className="flex-1 h-full rounded-[2px] bg-[#1a1d26] [data-theme=light]:bg-[#2a2d38] border-t border-white/10 shadow-xs"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Trackpad */}
          <div className="mx-auto mt-1 sm:mt-2 w-36 sm:w-56 h-[18%] sm:h-[20%] rounded-md bg-[#161822] [data-theme=light]:bg-[#e0e2e7] border border-white/10 [data-theme=light]:border-black/10 shadow-inner" />
        </motion.div>

        {/* 2. Screen Lid (Hinged at top of base deck) */}
        <motion.div
          initial={{ rotateX: -65, opacity: 0.5 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            transformOrigin: 'bottom center',
            transformStyle: 'preserve-3d',
          }}
          className="absolute bottom-[48%] left-[2%] w-[96%] aspect-[16/10] rounded-t-2xl rounded-b-sm bg-[#050507] border border-white/20 [data-theme=light]:border-black/20 shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_1px_2px_rgba(255,255,255,0.35)] overflow-hidden"
        >
          {/* Camera Notch at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 sm:w-28 h-2.5 sm:h-3.5 bg-black rounded-b-md z-30 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 ring-1 ring-white/20" />
          </div>

          {/* Retina Bezel */}
          <div className="relative w-full h-full p-2 sm:p-3 bg-black flex flex-col">
            {/* Inner Dashboard Viewport */}
            <div className="relative w-full h-full rounded-lg bg-[#07090e] border border-white/10 overflow-hidden flex flex-col font-mono text-xs">
              {/* Glass Glare Specular Gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06] pointer-events-none z-20" />

              {/* Titlebar */}
              <div className="h-6 sm:h-7 px-3 bg-[#0d0f16] border-b border-white/10 flex items-center justify-between z-10 select-none">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  <span className="ml-2 text-[10px] text-zinc-400 font-sans hidden sm:inline">
                    QSlate Lab • Tick Simulation #8491
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-sans font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    SIM ENGINE 60 FPS
                  </span>
                </div>
              </div>

              {/* Main Content Dashboard Grid */}
              <div className="flex-1 p-2 sm:p-3 grid grid-rows-[1.2fr_1fr] gap-2 overflow-hidden bg-black/40">
                {/* Top Widgets: Equity Curve & Drawdown Waterfall */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-hidden">
                  {/* Widget A: Equity Curve */}
                  <div className="rounded-md bg-[#0a0c12] border border-white/5 p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400 font-sans flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-cyan-400" /> Equity
                        Curve
                      </span>
                      <span className="text-emerald-400 font-bold">+29.2%</span>
                    </div>

                    {/* SVG Vector Chart */}
                    <div className="relative h-16 sm:h-20 w-full mt-1">
                      <svg
                        viewBox="0 0 200 80"
                        className="w-full h-full overflow-visible"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient
                            id="laptopEquityGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#00E5FF"
                              stopOpacity="0.4"
                            />
                            <stop
                              offset="100%"
                              stopColor="#00E5FF"
                              stopOpacity="0.0"
                            />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,65 Q25,60 50,48 T100,42 T150,22 T200,8 L200,80 L0,80 Z"
                          fill="url(#laptopEquityGrad)"
                        />
                        <path
                          d="M0,65 Q25,60 50,48 T100,42 T150,22 T200,8"
                          fill="none"
                          stroke="#00E5FF"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Widget B: Drawdown Waterfall */}
                  <div className="rounded-md bg-[#0a0c12] border border-white/5 p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400 font-sans flex items-center gap-1">
                        <Activity className="w-3 h-3 text-rose-400" /> Drawdown
                        Waterfall
                      </span>
                      <span className="text-rose-400 font-bold">-3.2% max</span>
                    </div>

                    {/* Candlestick & Volume Simulation Bars */}
                    <div className="flex items-end justify-between h-16 sm:h-20 pt-2 px-1 gap-1">
                      {[35, 50, 45, 60, 40, 75, 65, 85, 55, 95, 80, 100].map(
                        (val, i) => (
                          <div
                            key={i}
                            className="flex-1 flex flex-col items-center justify-end h-full"
                          >
                            <div
                              style={{ height: `${val}%` }}
                              className={`w-full rounded-xs ${
                                i % 3 === 0
                                  ? 'bg-rose-500/80'
                                  : 'bg-emerald-400/80'
                              }`}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Widget: Python Mini IDE */}
                <div className="rounded-md bg-[#06070a] border border-white/5 p-2 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pb-1 border-b border-white/5 font-sans">
                    <span>strategy.py • Rust SIMD Execution</span>
                    <span>1,420,800 ticks/sec</span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] leading-relaxed text-zinc-300 font-mono mt-1 overflow-hidden">
                    <div>
                      <span className="text-purple-400">from</span>{' '}
                      <span className="text-cyan-400">qslate.core</span>{' '}
                      <span className="text-purple-400">import</span> Strategy,
                      Signals, Risk
                    </div>
                    <div>
                      <span className="text-purple-400">class</span>{' '}
                      <span className="text-yellow-300">
                        MeanReversionAlpha
                      </span>
                      (Strategy):
                    </div>
                    <div className="pl-3">
                      <span className="text-purple-400">def</span>{' '}
                      <span className="text-blue-400">on_market_tick</span>
                      (self, tick):
                    </div>
                    <div className="pl-6">
                      <span className="text-purple-400">if</span> tick.rsi_4h
                      &lt; <span className="text-emerald-400">30.0</span>:{' '}
                      self.rebalance(weight=
                      <span className="text-emerald-400">0.25</span>)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. Floating 3D Parallax Badges */}
        {/* Chip 1: Sharpe Ratio Badge (Top Right) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
            y: [0, -8, 0],
          }}
          transition={{
            opacity: { duration: 0.8, delay: 0.4 },
            scale: { duration: 0.8, delay: 0.4 },
            x: { duration: 0.8, delay: 0.4 },
            y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute -top-8 sm:-top-6 -right-2 sm:-right-8 z-40 px-3.5 py-2.5 rounded-xl bg-[#0c0e14]/95 [data-theme=light]:bg-white/95 backdrop-blur-md border border-white/20 [data-theme=light]:border-black/10 shadow-[0_20px_45px_rgba(0,0,0,0.7)] flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 [data-theme=light]:text-zinc-500 font-sans font-medium">
              Sharpe Ratio
            </div>
            <div className="text-base sm:text-lg font-bold text-white [data-theme=light]:text-zinc-950 flex items-center gap-1.5 font-sans">
              2.41{' '}
              <span className="text-xs font-semibold text-emerald-400 flex items-center">
                +0.74
              </span>
            </div>
          </div>
        </motion.div>

        {/* Chip 2: Risk Engine Tick-Level Badge (Bottom Left) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: -20 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
            y: [0, 8, 0],
          }}
          transition={{
            opacity: { duration: 0.8, delay: 0.5 },
            scale: { duration: 0.8, delay: 0.5 },
            x: { duration: 0.8, delay: 0.5 },
            y: {
              duration: 4.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            },
          }}
          className="absolute -bottom-6 -left-2 sm:-left-8 z-40 px-3.5 py-2.5 rounded-xl bg-[#0c0e14]/95 [data-theme=light]:bg-white/95 backdrop-blur-md border border-white/20 [data-theme=light]:border-black/10 shadow-[0_20px_45px_rgba(0,0,0,0.7)] flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 [data-theme=light]:text-zinc-500 font-sans font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Risk Engine: Tick-Level
            </div>
            <div className="text-sm sm:text-base font-bold text-white [data-theme=light]:text-zinc-950 flex items-center gap-1.5 font-sans">
              8ms{' '}
              <span className="text-xs font-normal text-zinc-400 [data-theme=light]:text-zinc-500">
                @ $1,154.50
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
