'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Zap } from 'lucide-react';
import dynamic from 'next/dynamic';
import { type ReactNode, useCallback, useRef, useState } from 'react';

import type { ThemeMode } from '@/shared/theme/types';

import { DeviceFallback } from './DeviceFallback';
import { DeviceSceneBoundary } from './DeviceSceneBoundary';

// Only the WebGL scene is deferred; the page structure is rendered on the server.
const Macbook3DShowcase = dynamic(
  () => import('./Macbook3DShowcase').then((mod) => mod.Macbook3DShowcase),
  { ssr: false }
);

interface DeviceShowcaseProps {
  intro: ReactNode;
  theme: ThemeMode;
}

export function DeviceShowcase({ intro, theme }: DeviceShowcaseProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>(
    'loading'
  );
  const handleReady = useCallback(() => setStatus('ready'), []);
  const handleUnavailable = useCallback(() => setStatus('unavailable'), []);
  const isStatic = status === 'unavailable';
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: progress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const introOpacity = useTransform(progress, [0, 0.2], [1, 0]);
  const introY = useTransform(progress, [0, 0.2], [0, -40]);
  const introPointerEvents = useTransform(progress, (p) =>
    p > 0.16 ? 'none' : 'auto'
  );
  const badgeOpacity = useTransform(progress, [0.5, 0.6], [0, 1]);

  return (
    <div ref={containerRef} className="relative h-[190svh]">
      <div className="sticky top-0 flex h-svh w-full items-center justify-center overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[75vh] w-[90vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.22),rgba(99,102,241,0.16)_38%,rgba(15,23,42,0.4)_65%,transparent_80%)] sm:blur-3xl opacity-80 dark:opacity-100 transition-opacity"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[45vh] w-[60vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),rgba(56,189,248,0.08)_50%,transparent_75%)] blur-2xl dark:sm:block hidden"
        />

        <div className="absolute inset-0 z-10" aria-busy={status === 'loading'}>
          {status !== 'ready' && (
            <DeviceFallback loading={status === 'loading'} />
          )}
          {!isStatic && (
            <DeviceSceneBoundary onError={handleUnavailable}>
              <Macbook3DShowcase
                progress={progress}
                theme={theme}
                onReady={handleReady}
                onUnavailable={handleUnavailable}
              />
            </DeviceSceneBoundary>
          )}
        </div>

        <motion.div
          style={{
            opacity: isStatic ? 1 : introOpacity,
            y: isStatic ? 0 : introY,
            pointerEvents: isStatic ? 'auto' : introPointerEvents,
          }}
          className="absolute inset-x-0 top-0 z-30 px-4 pt-[clamp(4.5rem,10vh,7rem)] sm:px-6"
        >
          {intro}
        </motion.div>

        <motion.div
          style={{ opacity: isStatic ? 0 : badgeOpacity }}
          className="pointer-events-none absolute inset-0 z-20 mx-auto max-w-6xl"
        >
          <div className="absolute right-4 top-[32%] rounded-xl border border-white/10 light:border-black/10 bg-black/60 light:bg-white/80 px-4 py-3 shadow-2xl sm:backdrop-blur-xl sm:right-8 lg:right-12">
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 light:text-zinc-500">
              Sharpe ratio
            </p>
            <p className="mt-1 flex items-baseline gap-2 font-mono text-xl tabular-nums text-white light:text-zinc-950">
              <span className="font-bold text-emerald-400">2.41</span>
              <span className="text-xs text-rose-400">Max DD -8.7%</span>
            </p>
          </div>

          <div className="absolute bottom-[16%] left-4 rounded-xl border border-white/10 light:border-black/10 bg-black/60 light:bg-white/80 p-3 shadow-2xl sm:backdrop-blur-xl sm:left-8 lg:left-12">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
                <Zap className="size-4" aria-hidden="true" />
              </span>
              <div className="font-mono">
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 light:text-zinc-500">
                  Execution fill
                </p>
                <p className="text-xs font-semibold text-white light:text-zinc-900">
                  ES1! <span className="text-emerald-400">BUY</span> 10 @
                  $5,120.50
                </p>
                <p className="text-[10px] text-zinc-400 light:text-zinc-500">
                  0.0ms slippage • Rust Core
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
