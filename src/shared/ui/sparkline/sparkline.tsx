import { useId } from 'react';

import { cn } from '@/shared/lib/class-names';

export type SparklineTone = 'brand' | 'gain' | 'loss' | 'neutral';

export interface SparklineProps {
  readonly data: readonly number[];
  readonly tone?: SparklineTone | undefined;
  /** Fills the area under the line with a fading gradient. */
  readonly area?: boolean | undefined;
  /** When set, the chart is exposed as an image with this description. */
  readonly label?: string | undefined;
  readonly className?: string | undefined;
}

const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 32;
const PADDING = 2;

const TONE_COLORS: Readonly<Record<SparklineTone, string>> = {
  brand: 'var(--a2)',
  gain: 'var(--gain)',
  loss: 'var(--loss)',
  neutral: 'var(--fg-3)',
};

function toPoints(data: readonly number[]): string {
  const finite = data.filter((value) => Number.isFinite(value));
  if (finite.length < 2) return '';
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const range = max - min || 1;
  const step = VIEW_WIDTH / (finite.length - 1);
  return finite
    .map((value, index) => {
      const x = index * step;
      const y =
        PADDING + (1 - (value - min) / range) * (VIEW_HEIGHT - PADDING * 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

/** Dependency-free SVG sparkline that stretches to its container. */
export function Sparkline({
  data,
  tone = 'brand',
  area = false,
  label,
  className,
}: SparklineProps) {
  const gradientId = useId();
  const points = toPoints(data);
  if (!points) return null;
  const color = TONE_COLORS[tone];

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="none"
      className={cn('block h-full w-full overflow-visible', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {area ? (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon
            points={`0,${VIEW_HEIGHT} ${points} ${VIEW_WIDTH},${VIEW_HEIGHT}`}
            fill={`url(#${gradientId})`}
          />
        </>
      ) : null}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
