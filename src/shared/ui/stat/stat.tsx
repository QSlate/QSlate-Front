import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/class-names';

import { InfoTip } from '../tooltip';

const DEFAULT_FORMATTER = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
});

export interface StatProps {
  readonly label: string;
  /** Raw value; `null` renders an em dash ("not available"). */
  readonly value: number | null;
  /** Formats the absolute value; the sign is added by the component. */
  readonly format?: ((absoluteValue: number) => string) | undefined;
  /** Unit appended after the figure (e.g. "%", "USD"). */
  readonly unit?: string | undefined;
  /**
   * Shows the direction with ▲/▼, an explicit +/− sign and gain/loss colour.
   * Without it the value is neutral and only a leading "−" is shown.
   */
  readonly signed?: boolean | undefined;
  /** Secondary line under the value (period, comparison, source). */
  readonly sub?: ReactNode | undefined;
  /** One-sentence explanation shown in an ⓘ tooltip. */
  readonly info?: string | undefined;
  readonly size?: 'md' | 'lg' | undefined;
  readonly className?: string | undefined;
}

type Direction = 'up' | 'down' | 'flat';

function directionOf(value: number): Direction {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'flat';
}

const DIRECTION_TEXT: Readonly<Record<Direction, string>> = {
  up: 'en hausse',
  down: 'en baisse',
  flat: 'stable',
};

/** KPI block: label, mono figure with direction indicator, optional sub-line. */
export function Stat({
  label,
  value,
  format = (absoluteValue) => DEFAULT_FORMATTER.format(absoluteValue),
  unit,
  signed = false,
  sub,
  info,
  size = 'lg',
  className,
}: StatProps) {
  const direction = value === null ? 'flat' : directionOf(value);
  const sign =
    value === null || direction === 'flat'
      ? ''
      : direction === 'up'
        ? signed
          ? '+'
          : ''
        : '−';
  const arrow =
    signed && direction !== 'flat' ? (direction === 'up' ? '▲' : '▼') : null;

  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-fg-2">
        <span>{label}</span>
        {info ? <InfoTip content={info} label={`À propos : ${label}`} /> : null}
      </div>
      <p
        className={cn(
          'm-0 mt-1 flex items-baseline gap-1.5 whitespace-nowrap font-mono tabular-nums tracking-[-0.04em]',
          size === 'lg'
            ? 'text-[28px] font-semibold leading-[1.1]'
            : 'text-lg font-semibold leading-tight',
          value === null && 'font-medium text-fg-3',
          value !== null && signed && direction === 'up' && 'text-gain',
          value !== null && signed && direction === 'down' && 'text-loss'
        )}
      >
        {arrow ? (
          <span aria-hidden="true" className="text-[0.55em]">
            {arrow}
          </span>
        ) : null}
        <span>
          {value === null ? '—' : `${sign}${format(Math.abs(value))}`}
          {unit && value !== null ? (
            <span className="ml-1 text-[0.6em] font-medium text-fg-3">
              {unit}
            </span>
          ) : null}
        </span>
        {signed && value !== null ? (
          <span className="sr-only">{DIRECTION_TEXT[direction]}</span>
        ) : null}
        {value === null ? (
          <span className="sr-only">non disponible</span>
        ) : null}
      </p>
      {sub ? (
        <p className="m-0 mt-1 whitespace-nowrap text-[11.5px] text-fg-3">
          {sub}
        </p>
      ) : null}
    </div>
  );
}
