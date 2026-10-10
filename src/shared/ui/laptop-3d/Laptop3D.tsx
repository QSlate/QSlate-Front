'use client';

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Laptop3DProps {
  progress: MotionValue<number>;
  interactive?: boolean;
}

export function Laptop3D({ progress, interactive = true }: Laptop3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse parallax normalized coordinates [-1, 1]
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

  // Screen lid rotation: from resting flat on base (-92deg) to open viewing angle (0deg)
  const lidRotateX = useTransform(progress, [0, 0.85], [-92, 0]);

  // Overall chassis pitch: from inclined perspective to upright focused elevation
  const chassisPitch = useTransform(progress, [0, 0.85], [32, 14]);
  const chassisScale = useTransform(progress, [0, 0.85], [0.85, 1.05]);
  const chassisTranslateY = useTransform(progress, [0, 0.85], [120, 0]);

  // Interactive subtle mouse yaw & pitch
  const mouseYaw = useTransform(smoothMouseX, [-1, 1], [-4, 4]);
  const mousePitch = useTransform(smoothMouseY, [-1, 1], [3, -3]);
  const combinedPitch = useTransform(
    [chassisPitch, mousePitch],
    ([cp, mp]: number[]) => cp + mp
  );

  // Floating chips parallax depths in 3D Z-space
  const chip1Z = useTransform(progress, [0.3, 0.9], [0, 90]);
  const chip1Opacity = useTransform(progress, [0.3, 0.6], [0, 1]);
  const chip1ParallaxX = useTransform(smoothMouseX, [-1, 1], [-18, 18]);
  const chip1ParallaxY = useTransform(smoothMouseY, [-1, 1], [-12, 12]);

  const chip2Z = useTransform(progress, [0.4, 0.95], [0, 80]);
  const chip2Opacity = useTransform(progress, [0.4, 0.7], [0, 1]);
  const chip2ParallaxX = useTransform(smoothMouseX, [-1, 1], [15, -15]);
  const chip2ParallaxY = useTransform(smoothMouseY, [-1, 1], [10, -10]);

  const chip3Z = useTransform(progress, [0.25, 0.8], [0, 60]);
  const chip3Opacity = useTransform(progress, [0.25, 0.5], [0, 1]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full min-h-[640px] lg:min-h-[780px] perspective-1200 overflow-visible select-none"
    >
      {/* 3D Chassis Rig */}
      <motion.div
        style={{
          rotateX: combinedPitch,
          rotateY: mouseYaw,
          scale: chassisScale,
          y: chassisTranslateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-[340px] sm:w-[580px] md:w-[760px] lg:w-[940px] aspect-[16/10] flex items-end justify-center"
      >
        {/* Ground ambient drop shadow */}
        <motion.div
          style={{
            transform: 'translateZ(-120px) rotateX(90deg)',
            opacity: useTransform(progress, [0, 0.8], [0.3, 0.65]),
          }}
          className="absolute -bottom-16 w-[90%] h-[180px] bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none"
        />

        {/* 1. Base Deck (Chassis bottom) */}
        <div
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(0px)',
          }}
          className="relative w-full h-[52%] rounded-b-2xl rounded-t-sm bg-gradient-to-b from-[#1e2029] via-[#12141a] to-[#0a0c10] border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)]"
        >
          {/* Front lip thumb notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-1.5 bg-black/60 rounded-b-md border-b border-white/10" />

          {/* Keyboard deck recess */}
          <div className="mx-auto mt-4 w-[88%] h-[68%] rounded-lg bg-[#08090c] border border-white/5 p-2 shadow-inner flex flex-col justify-between">
            {/* Keyboard simulated chiclet grid */}
            <div className="w-full h-full grid grid-rows-5 gap-1 opacity-70">
              {[14, 14, 13, 12, 9].map((cols, rowIndex) => (
                <div key={rowIndex} className="flex gap-1 justify-center">
                  {Array.from({ length: cols }).map((_, colIndex) => (
                    <div
                      key={colIndex}
                      className="flex-1 h-full rounded-[2px] bg-[#1a1c24] border-t border-white/10 shadow-sm"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Trackpad */}
          <div className="mx-auto mt-2 w-36 sm:w-56 h-[18%] rounded-md bg-[#161820] border border-white/10 shadow-inner" />
        </div>

        {/* 2. Screen Lid (Hinged at the rear of base deck) */}
        <motion.div
          style={{
            rotateX: lidRotateX,
            transformOrigin: 'bottom center',
            transformStyle: 'preserve-3d',
          }}
          className="absolute bottom-[50%] left-[2%] w-[96%] aspect-[16/10] rounded-t-2xl rounded-b-sm bg-[#050507] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.3)] overflow-hidden"
        >
          {/* Top bezel notch & camera */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-3 bg-black rounded-b-md z-30 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/40 ring-1 ring-white/10" />
          </div>

          {/* Retina Screen Glass Frame */}
          <div className="relative w-full h-full p-2.5 sm:p-3 bg-black flex flex-col">
            {/* Inner Dashboard Viewport */}
            <div className="relative w-full h-full rounded-lg bg-[#07080b] border border-white/10 overflow-hidden flex flex-col font-mono text-xs">
              {/* Screen Specular Reflection Glare */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] pointer-events-none z-20" />

              {/* Titlebar */}
              <div className="h-7 px-3 bg-[#0d0f14] border-b border-white/10 flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  <span className="ml-2 text-[10px] text-zinc-400 hidden sm:inline">
                    QSlate Lab • Tick Simulation #8491
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-semibold">
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
                  <div className="rounded-md bg-[#0a0c10] border border-white/5 p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400 flex items-center gap-1">
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
                            id="equityGrad"
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
                          fill="url(#equityGrad)"
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
                  <div className="rounded-md bg-[#0a0c10] border border-white/5 p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400 flex items-center gap-1">
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
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pb-1 border-b border-white/5">
                    <span>strategy.py • Rust SIMD Execution</span>
                    <span>1,420,800 ticks/sec</span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] leading-relaxed text-zinc-300 font-mono mt-1 overflow-hidden">
                    <div>
                      <span className="text-purple-400">from</span>{' '}
                      <span className="text-cyan-400">qslate</span>{' '}
                      <span className="text-purple-400">import</span> Strategy,
                      PolarsEngine
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
                      <span className="text-zinc-500">
                        # AST verified SIMD execution
                      </span>
                    </div>
                    <div className="pl-6">
                      <span className="text-purple-400">if</span> tick.rsi_4h
                      &lt; <span className="text-emerald-400">30.0</span>:{' '}
                      self.rebalance(target_weight=
                      <span className="text-emerald-400">0.25</span>)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. Floating 3D Parallax Badge Metrics */}
        {/* Chip 1: Sharpe Ratio Badge (Top Right) */}
        <motion.div
          style={{
            z: chip1Z,
            opacity: chip1Opacity,
            x: chip1ParallaxX,
            y: chip1ParallaxY,
            transformStyle: 'preserve-3d',
          }}
          className="absolute -top-12 sm:-top-8 -right-2 sm:-right-8 z-40 px-3.5 py-2.5 rounded-xl bg-[#0c0e14]/90 backdrop-blur-md border border-white/20 shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
              Sharpe Ratio
            </div>
            <div className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
              2.41{' '}
              <span className="text-xs font-semibold text-emerald-400 flex items-center">
                +0.74
              </span>
            </div>
          </div>
        </motion.div>

        {/* Chip 2: P99 Execution Speed (Bottom Left) */}
        <motion.div
          style={{
            z: chip2Z,
            opacity: chip2Opacity,
            x: chip2ParallaxX,
            y: chip2ParallaxY,
            transformStyle: 'preserve-3d',
          }}
          className="absolute -bottom-8 -left-2 sm:-left-8 z-40 px-3.5 py-2.5 rounded-xl bg-[#0c0e14]/90 backdrop-blur-md border border-white/20 shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
              Tick Execution P99
            </div>
            <div className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
              8ms{' '}
              <span className="text-xs font-normal text-zinc-400">
                @ $1,154.50
              </span>
            </div>
          </div>
        </motion.div>

        {/* Chip 3: Alpha Outperformance (Top Left) */}
        <motion.div
          style={{
            z: chip3Z,
            opacity: chip3Opacity,
            transformStyle: 'preserve-3d',
          }}
          className="absolute top-10 -left-4 sm:-left-6 z-40 hidden sm:flex px-3 py-1.5 rounded-lg bg-[#0c0e14]/90 backdrop-blur-md border border-white/15 shadow-xl items-center gap-2"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400">
            +29.2% Alpha
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
