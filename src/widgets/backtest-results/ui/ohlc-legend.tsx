import type { Candle } from '@/entities/dataset';
import { cn } from '@/shared/lib/class-names';

import {
  directionOf,
  formatAmount,
  formatDayTime,
  formatPrice,
  formatSignedPercent,
} from '../model/format';

interface OhlcLegendProps {
  readonly candle: Candle;
}

/** "18 mars 25 14:00 · O … H … L … C … ▲ +0,4 % · Vol …" */
export function OhlcLegend({ candle }: OhlcLegendProps) {
  const change =
    candle.open === 0 ? 0 : ((candle.close - candle.open) / candle.open) * 100;
  const direction = directionOf(change);
  return (
    <div className="pointer-events-none absolute left-1 top-0 z-[2] flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 rounded-md bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] px-1.5 py-0.5 font-mono text-[10.5px] text-fg-3">
      <span>{formatDayTime(candle.time)}</span>
      {(
        [
          ['O', candle.open],
          ['H', candle.high],
          ['B', candle.low],
          ['C', candle.close],
        ] as const
      ).map(([label, value]) => (
        <span key={label}>
          {label} <b className="font-medium text-fg">{formatPrice(value)}</b>
        </span>
      ))}
      <b
        className={cn(
          'font-medium',
          direction === 'up' && 'text-gain',
          direction === 'down' && 'text-loss',
          direction === 'flat' && 'text-fg-2'
        )}
      >
        {formatSignedPercent(change, 2)}
      </b>
      <span>
        Vol{' '}
        <b className="font-medium text-fg-2">{formatAmount(candle.volume)}</b>
      </span>
    </div>
  );
}
