import { Star } from 'lucide-react';

import { cn } from '@/shared/lib/class-names';

const RATING = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const COUNT = new Intl.NumberFormat('fr-FR');

interface RatingStarsProps {
  /** 0–5 (rounded to the nearest whole star). */
  readonly value: number;
  readonly size?: number | undefined;
  readonly className?: string | undefined;
}

/** Five stars, the first `value` filled; read as "4 sur 5". */
export function RatingStars({ value, size = 12, className }: RatingStarsProps) {
  const filled = Math.round(Math.min(5, Math.max(0, value)));
  return (
    <span
      role="img"
      aria-label={`${filled} sur 5`}
      className={cn('inline-flex text-warn', className)}
    >
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          size={size}
          aria-hidden="true"
          fill={index <= filled ? 'currentColor' : 'none'}
          className={index <= filled ? undefined : 'text-fg-3'}
        />
      ))}
    </span>
  );
}

interface RatingSummaryProps {
  readonly average: number;
  readonly count: number;
}

/** "★★★★☆ 4,2 (12)" or "Pas encore d'avis". */
export function RatingSummary({ average, count }: RatingSummaryProps) {
  if (count === 0) {
    return (
      <span className="text-[11.5px] text-fg-3">Pas encore d&apos;avis</span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-fg-3">
      <RatingStars value={average} />
      <span className="font-mono">
        <b className="font-medium text-fg-2">{RATING.format(average)}</b> (
        {COUNT.format(count)})<span className="sr-only"> avis</span>
      </span>
    </span>
  );
}
