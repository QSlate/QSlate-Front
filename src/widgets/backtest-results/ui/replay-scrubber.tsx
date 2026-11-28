'use client';

import { type ChangeEvent, memo } from 'react';

import { cn, FOCUS_RING } from '@/shared/lib/class-names';

import type { TradeAction } from '../model/price-markers';

/** An order drawn on the timeline (one per few pixels at most). */
export interface ScrubberTick {
  readonly candleIndex: number;
  readonly action: TradeAction;
}

export interface ReplayScrubberProps {
  readonly cursor: number;
  readonly lastIndex: number;
  readonly ticks: readonly ScrubberTick[];
  /** Spoken value, e.g. "18 mars 2025 14:00, bougie 1 234 sur 8 760". */
  readonly valueText: string;
  readonly startLabel: string;
  readonly endLabel: string;
  readonly onSeek: (index: number) => void;
}

// Thumb styles, spelled out per engine (Tailwind only sees literal names).
const THUMB_WEBKIT =
  '[&::-webkit-slider-thumb]:mt-[5px] [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_var(--brand),0_4px_12px_-2px_var(--glow)] motion-safe:[&::-webkit-slider-thumb]:transition-[box-shadow,scale] hover:[&::-webkit-slider-thumb]:scale-115 focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_3px_var(--brand),0_0_0_8px_var(--brand-soft)]';
const THUMB_MOZ =
  '[&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_0_0_3px_var(--brand),0_4px_12px_-2px_var(--glow)] focus-visible:[&::-moz-range-thumb]:shadow-[0_0_0_3px_var(--brand),0_0_0_8px_var(--brand-soft)]';

interface TicksProps {
  readonly ticks: readonly ScrubberTick[];
  readonly lastIndex: number;
}

/** Order ticks: re-rendered only when the run changes. */
const Ticks = memo(function Ticks({ ticks, lastIndex }: TicksProps) {
  return ticks.map((tick) => (
    <span
      key={tick.candleIndex}
      data-candle={tick.candleIndex}
      className={cn(
        'absolute top-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full',
        tick.action === 'buy' ? 'bg-gain' : 'bg-loss'
      )}
      style={{ left: `${(tick.candleIndex / lastIndex) * 100}%` }}
    />
  ));
});

/**
 * Timeline of the replay: a native range input (keyboard, screen readers)
 * over a track that shows the revealed part and where the orders happen.
 */
export function ReplayScrubber({
  cursor,
  lastIndex,
  ticks,
  valueText,
  startLabel,
  endLabel,
  onSeek,
}: ReplayScrubberProps) {
  const progress = lastIndex === 0 ? 100 : (cursor / lastIndex) * 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="relative h-6">
        {/* Inset by the thumb radius so the fill ends under the thumb. */}
        <div aria-hidden="true" className="absolute inset-x-[7px] inset-y-0">
          <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[color-mix(in_srgb,var(--fg-3)_22%,transparent)]" />
          <span
            className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-gradient"
            style={{ width: `${progress}%` }}
          />
          <span className="absolute inset-0 opacity-30">
            <Ticks ticks={ticks} lastIndex={Math.max(lastIndex, 1)} />
          </span>
          <span
            className="absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
          >
            <Ticks ticks={ticks} lastIndex={Math.max(lastIndex, 1)} />
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={lastIndex}
          step={1}
          value={cursor}
          aria-label="Position dans le backtest"
          aria-valuetext={valueText}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onSeek(Number(event.target.value))
          }
          className={cn(
            FOCUS_RING,
            'absolute inset-0 m-0 h-full w-full cursor-pointer appearance-none rounded-full bg-transparent',
            '[&::-webkit-slider-runnable-track]:h-full [&::-webkit-slider-runnable-track]:bg-transparent',
            '[&::-moz-range-track]:bg-transparent',
            THUMB_WEBKIT,
            THUMB_MOZ
          )}
        />
      </div>
      <div
        aria-hidden="true"
        className="flex justify-between px-px font-mono text-[10.5px] text-fg-3"
      >
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
}
