import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/class-names';

export type BadgeTone = 'neutral' | 'brand' | 'gain' | 'loss' | 'warn' | 'vio';

export interface BadgeProps {
  readonly children: ReactNode;
  readonly tone?: BadgeTone | undefined;
  /** Rounded "pill" with a status dot, as used in the status strip. */
  readonly dot?: boolean | undefined;
  /** Animates the status dot (e.g. a running backtest). */
  readonly pulse?: boolean | undefined;
  readonly mono?: boolean | undefined;
  readonly className?: string | undefined;
}

const TONE_CLASSES: Readonly<Record<BadgeTone, string>> = {
  neutral: 'bg-sunken text-fg-2 border-line',
  brand: 'bg-brand-soft text-brand border-brand-line',
  gain: 'bg-gain-soft text-gain border-transparent',
  loss: 'bg-loss-soft text-loss border-transparent',
  warn: 'bg-warn-soft text-warn border-transparent',
  vio: 'bg-vio-soft text-vio border-transparent',
};

const DOT_CLASSES: Readonly<Record<BadgeTone, string>> = {
  neutral: 'bg-fg-3',
  brand: 'bg-a2 shadow-[0_0_10px_var(--a2)]',
  gain: 'bg-gain shadow-[0_0_8px_var(--gain)]',
  loss: 'bg-loss',
  warn: 'bg-warn',
  vio: 'bg-vio',
};

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  pulse = false,
  mono = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap border font-semibold',
        dot
          ? 'h-[26px] rounded-full px-2.5 text-xs font-medium'
          : 'h-5 rounded-md px-[7px] text-[10.5px]',
        mono && 'font-mono',
        TONE_CLASSES[tone],
        className
      )}
    >
      {dot ? (
        <i
          aria-hidden="true"
          className={cn(
            'size-[7px] rounded-full',
            DOT_CLASSES[tone],
            pulse &&
              'animate-[qs-pulse_1.4s_ease-in-out_infinite] motion-reduce:animate-none'
          )}
        />
      ) : null}
      {children}
    </span>
  );
}
