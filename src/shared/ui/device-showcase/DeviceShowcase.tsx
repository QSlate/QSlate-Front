'use client';

import {
  motion,
  MotionValue,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import {
  Activity,
  CalendarRange,
  ChevronDown,
  FileCode2,
  Gauge,
  LayoutGrid,
  LineChart,
  Settings2,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import React, { useLayoutEffect, useRef, useState } from 'react';

import { DrawdownWidget } from './widgets/drawdown';
import { EquityCurveWidget } from './widgets/equity-curve';
import { MiniIdeWidget } from './widgets/mini-ide';

const CANVAS_W = 1280;
const CANVAS_H = 800;
const CHASSIS = '#0C0D12';

export function DeviceShowcase({ intro }: { intro: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });
  const restingStart = useMotionValue(0);
  const progress = reduceMotion ? restingStart : scrollYProgress;

  const lidRotate = useTransform(progress, [0, 0.5], [-84, 0]);
  const stageTilt = useTransform(progress, [0, 0.5, 0.8], [22, 7, 0]);
  const stageScale = useTransform(progress, [0, 0.8], [0.84, 1]);
  const stageY = useTransform(progress, [0, 0.5], ['16vh', '3vh']);
  const deckOpacity = useTransform(progress, [0.45, 0.78], [1, 0]);

  const power = useTransform(progress, [0.15, 0.48], [0, 1]);
  const brightness = useTransform(power, [0, 1], [0.15, 1]);
  const screenFilter = useMotionTemplate`brightness(${brightness})`;

  const introOpacity = useTransform(progress, [0, 0.2], [1, 0]);
  const introY = useTransform(progress, [0, 0.2], [0, -70]);
  const introPointer = useTransform(progress, (v: number) =>
    v > 0.15 ? 'none' : 'auto'
  );

  if (reduceMotion) {
    return (
      <div className="relative">
        {intro}
        <StaticDevice />
      </div>
    );
  }

  return (
    <div ref={trackRef} className="relative h-[250vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-x-clip px-4">
        <motion.div
          style={{
            opacity: introOpacity,
            y: introY,
            pointerEvents: introPointer,
          }}
          className="absolute inset-x-0 top-0 z-30 px-4 pt-[clamp(4.5rem,12vh,7.5rem)] sm:px-6"
        >
          {intro}
        </motion.div>

        <motion.div
          aria-hidden="true"
          style={{ opacity: power }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[80vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.22),rgba(30,41,59,0.3)_45%,transparent_72%)] blur-3xl"
        />

        <div
          className="relative"
          style={{
            width: 'min(90vw, 980px, calc((100svh - 140px) * 1.42))',
            perspective: 1600,
          }}
        >
          <motion.div
            style={{
              rotateX: stageTilt,
              scale: stageScale,
              y: stageY,
              transformStyle: 'preserve-3d',
            }}
            className="relative will-change-transform"
          >
            <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
              <Deck opacity={deckOpacity} />
              <Lid rotate={lidRotate} power={power} filter={screenFilter} />

              <MetricBadge
                progress={progress}
                side="right"
                className="right-0 top-[8%] sm:-right-6 lg:-right-16"
              >
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                  Sharpe ratio
                </p>
                <p className="mt-1 flex items-baseline gap-2 font-mono text-sm tabular-nums sm:text-xl">
                  <span className="text-foreground">2.41</span>
                  <span className="text-[10px] text-loss sm:text-xs">
                    Max DD -8.7%
                  </span>
                </p>
              </MetricBadge>

              <MetricBadge
                progress={progress}
                side="left"
                className="bottom-[12%] left-0 sm:-left-6 lg:-left-16"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gain/15 text-gain ring-1 ring-gain/30 sm:size-8">
                    <Zap className="size-3 sm:size-4" aria-hidden="true" />
                  </span>
                  <div className="font-mono">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                      Order execution fill
                    </p>
                    <p className="mt-0.5 text-[10px] text-foreground sm:text-xs">
                      ES1! <span className="text-gain">BUY</span> 10 @ $5,120.50
                    </p>
                    <p className="text-[9px] text-muted-foreground sm:text-[10px]">
                      0.0ms slippage
                    </p>
                  </div>
                </div>
              </MetricBadge>
            </div>

            <FrontLip />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Lid({
  rotate,
  power,
  filter,
}: {
  rotate: MotionValue<number>;
  power: MotionValue<number>;
  filter: MotionValue<string>;
}) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / CANVAS_W);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      style={{
        rotateX: rotate,
        transformOrigin: '50% 100%',
        transformStyle: 'preserve-3d',
      }}
      className="relative aspect-[16/10.6] w-full"
    >
      <div
        className="absolute inset-0 rounded-t-[14px] rounded-b-[4px] border border-white/[0.1] p-[1.6%] pb-[2.4%] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_0_0_1px_rgba(255,255,255,0.02)] [backface-visibility:hidden] sm:rounded-t-[22px]"
        style={{ backgroundColor: CHASSIS }}
      >
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[1.6%] z-10 flex h-[3.2%] w-[11%] -translate-x-1/2 items-center justify-center rounded-b-[8px]"
          style={{ backgroundColor: CHASSIS }}
        >
          <span className="size-[5px] rounded-full bg-[#1a1f2b] ring-1 ring-white/[0.07] sm:size-1.5" />
        </div>

        <div
          ref={screenRef}
          role="img"
          aria-label="QSLate modular lab running Momentum_ETH_4h.py on a 4H timeframe: cobalt equity curve, monthly PnL drawdown waterfall, and Python strategy editor with a completed simulation"
          className="relative h-full w-full overflow-hidden rounded-[6px] bg-black sm:rounded-[10px]"
        >
          <motion.div
            style={{ opacity: power, filter }}
            className="absolute inset-0"
          >
            <div
              className="absolute left-0 top-0 origin-top-left"
              style={{
                width: CANVAS_W,
                height: CANVAS_H,
                transform: `scale(${scale})`,
                visibility: scale ? 'visible' : 'hidden',
              }}
            >
              <ScreenDashboard />
            </div>
          </motion.div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,rgba(255,255,255,0.06)_0%,transparent_38%)]"
          />
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center rounded-t-[14px] rounded-b-[4px] border border-white/[0.08] bg-[linear-gradient(180deg,#181a22_0%,#0e1016_55%,#0a0b10_100%)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] [backface-visibility:hidden] sm:rounded-t-[22px]"
        style={{ transform: 'rotateX(180deg)' }}
      >
        <span className="font-mono text-2xl font-semibold text-white/[0.09] sm:text-4xl">
          Q
        </span>
      </div>
    </motion.div>
  );
}

function Deck({ opacity }: { opacity: MotionValue<number> }) {
  return (
    <motion.div
      aria-hidden="true"
      style={{
        opacity,
        transform: 'rotateX(90deg)',
        transformOrigin: '50% 0%',
        backgroundColor: CHASSIS,
      }}
      className="absolute left-[-2%] top-full flex h-full w-[104%] flex-col items-center rounded-b-[18px] border border-white/[0.08] px-[6%] pt-[4%] shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.14)]"
    >
      <div className="grid h-[44%] w-full grid-cols-[repeat(14,minmax(0,1fr))] gap-[0.5%] rounded-md bg-black/50 p-[1%]">
        {Array.from({ length: 14 * 5 }, (_, i) => (
          <span key={i} className="rounded-[2px] bg-white/[0.035]" />
        ))}
      </div>
      <div className="mt-[4%] h-[36%] w-[42%] rounded-lg border border-white/[0.07] bg-white/[0.015]" />
    </motion.div>
  );
}

function FrontLip() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-[-4%] h-2.5 rounded-b-[14px] bg-gradient-to-b from-[#2b303b] via-[#151820] to-[#0b0d12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_30px_60px_-10px_rgba(0,0,0,0.9)] sm:h-4 sm:rounded-b-[22px]"
    >
      <span
        className="absolute left-1/2 top-0 h-[45%] w-[16%] -translate-x-1/2 rounded-b-md shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.06)]"
        style={{ backgroundColor: CHASSIS }}
      />
      <span className="absolute inset-x-[2%] top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
  );
}

function MetricBadge({
  progress,
  side,
  className,
  children,
}: {
  progress: MotionValue<number>;
  side: 'left' | 'right';
  className: string;
  children: React.ReactNode;
}) {
  const direction = side === 'left' ? -1 : 1;
  const x = useTransform(progress, [0.7, 1], [direction * 90, 0]);
  const y = useTransform(progress, [0.7, 1], [24, 0]);
  const z = useTransform(progress, [0.7, 1], [0, 60]);
  const opacity = useTransform(progress, [0.7, 0.92], [0, 1]);

  return (
    <motion.div
      aria-hidden="true"
      style={{ x, y, z, opacity }}
      className={`absolute z-20 rounded-xl border border-white/[0.12] bg-white/[0.06] px-3 py-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_24px_48px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:px-4 sm:py-3 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function ScreenDashboard() {
  return (
    <div className="flex h-full w-full bg-[#07080b] text-foreground">
      <nav className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-white/[0.06] bg-black/40 py-4">
        <span className="mb-3 flex size-8 items-center justify-center rounded-lg bg-white font-mono text-sm font-semibold text-black">
          Q
        </span>
        {[LayoutGrid, LineChart, Activity, ShieldAlert, Gauge].map(
          (Icon, i) => (
            <span
              key={i}
              className={`flex size-9 items-center justify-center rounded-lg ${
                i === 0 ? 'bg-white/[0.08] text-foreground' : 'text-zinc-500'
              }`}
            >
              <Icon className="size-4" />
            </span>
          )
        )}
        <span className="mt-auto flex size-9 items-center justify-center rounded-lg text-zinc-500">
          <Settings2 className="size-4" />
        </span>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] px-5">
          <span className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 font-mono text-[13px] text-zinc-200">
            <FileCode2 className="size-3.5 text-signal" />
            Momentum_ETH_4h.py
          </span>
          <span className="rounded-full border border-signal/40 bg-signal/10 px-2.5 py-1 font-mono text-[11px] text-signal">
            4H
          </span>
          <span className="font-mono text-[11px] text-zinc-500">
            main · a3f9e1c
          </span>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center rounded-md border border-white/[0.08] bg-white/[0.02] p-0.5 font-mono text-[11px]">
              {['1M', '6M', '1Y', '3Y', '5Y'].map((r) => (
                <span
                  key={r}
                  className={`rounded px-2.5 py-1 ${
                    r === '3Y'
                      ? 'bg-white/[0.1] text-foreground'
                      : 'text-zinc-500'
                  }`}
                >
                  {r}
                </span>
              ))}
            </div>
            <span className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[11px] text-zinc-400">
              <CalendarRange className="size-3.5" />
              2023-01-04 → 2026-01-04
              <ChevronDown className="size-3" />
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-gain/40 bg-gain/10 px-3 py-1.5 font-mono text-[11px] tracking-wide text-gain shadow-[0_0_24px_-2px_rgba(16,185,129,0.55)]">
              <span className="size-1.5 rounded-full bg-gain shadow-[0_0_8px_rgba(16,185,129,1)]" />
              SIMULATION COMPLETED
            </span>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-12 grid-rows-[auto_1fr] gap-3 p-3">
          <Panel
            title="equity_curve"
            meta="vs SPX · daily"
            className="col-span-8"
          >
            <EquityCurveWidget />
          </Panel>
          <Panel
            title="monthly_pnl · drawdown"
            meta="waterfall"
            live
            className="col-span-4"
          >
            <DrawdownWidget />
          </Panel>
          <Panel
            title="strategy.py"
            meta="python 3.12 · sandboxed"
            className="col-span-12 min-h-0"
          >
            <MiniIdeWidget />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  meta,
  live,
  className,
  children,
}: {
  title: string;
  meta: string;
  live?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] ${
        className ?? ''
      }`}
    >
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 font-mono text-[11px]">
        <span className="text-zinc-300">{title}</span>
        <span className="flex items-center gap-1.5 text-zinc-500">
          {live && (
            <span className="size-1.5 rounded-full bg-gain animate-pulse" />
          )}
          {meta}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}

function StaticDevice() {
  return (
    <div
      className="relative mx-auto mt-12"
      style={{
        width: 'min(90vw, 980px, calc((100svh - 140px) * 1.42))',
      }}
    >
      <div className="relative aspect-[16/10.6] w-full rounded-t-[22px] border border-white/[0.1] bg-[#0C0D12] p-[1.6%] pb-[2.4%]">
        <div className="relative h-full w-full overflow-hidden rounded-[10px] bg-black">
          <ScreenDashboard />
        </div>
      </div>
      <FrontLip />
    </div>
  );
}
