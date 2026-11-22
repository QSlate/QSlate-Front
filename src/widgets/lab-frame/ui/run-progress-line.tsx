'use client';

import { useBacktest } from '@/features/run-backtest';
import { cn } from '@/shared/lib/class-names';

/** 2px gradient progress line under the header while a backtest runs. */
export function RunProgressLine() {
  const { status, activeRun } = useBacktest();
  if (status !== 'running' && status !== 'cancelling') return null;
  const progress = activeRun?.job?.progress ?? null;
  return (
    <div
      role="progressbar"
      aria-label="Progression du backtest"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress ?? undefined}
      className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-[5] h-[2px] overflow-hidden bg-line"
    >
      <i
        className={cn(
          'block h-full bg-[linear-gradient(90deg,var(--a1),var(--a2))] shadow-[0_0_12px_var(--a2)] transition-[width] duration-500 ease-out motion-reduce:transition-none',
          progress === null &&
            'w-1/3 animate-[qs-pulse_1.4s_ease-in-out_infinite] motion-reduce:animate-none'
        )}
        // Width tracks a live percentage that has no static utility class.
        style={progress === null ? undefined : { width: `${progress}%` }}
      />
    </div>
  );
}
