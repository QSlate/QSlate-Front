import { cn } from '@/shared/lib/class-names';

export interface ProgressBarProps {
  /** Accessible name, e.g. "Progression du backtest". */
  readonly label: string;
  /** Percentage 0–100, or `null` while the total is unknown. */
  readonly value: number | null;
  readonly className?: string | undefined;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/**
 * Thin azure→cyan progress line built on the native `<progress>` element,
 * which exposes progressbar semantics; omitting the value makes it
 * indeterminate.
 */
export function ProgressBar({ label, value, className }: ProgressBarProps) {
  return (
    <progress
      aria-label={label}
      max={100}
      value={value === null ? undefined : clampPercent(value)}
      className={cn(
        'block h-0.5 w-full appearance-none overflow-hidden border-0 bg-line',
        '[&::-webkit-progress-bar]:bg-line',
        '[&::-webkit-progress-value]:bg-[linear-gradient(90deg,var(--a1),var(--a2))] [&::-webkit-progress-value]:shadow-[0_0_12px_var(--a2)] [&::-webkit-progress-value]:transition-[width]',
        '[&::-moz-progress-bar]:bg-[linear-gradient(90deg,var(--a1),var(--a2))]',
        value === null &&
          'animate-[qs-pulse_1.4s_ease-in-out_infinite] motion-reduce:animate-none',
        className
      )}
    />
  );
}
