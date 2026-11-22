'use client';

import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useId,
  useMemo,
  useState,
} from 'react';

import { cn, FOCUS_RING } from '@/shared/lib/class-names';

import { niceTicks } from '../model/axis-ticks';
import { downsample, nearestIndex } from '../model/downsample';
import { formatDay } from '../model/format';
import { useElementSize } from '../model/use-element-size';

export interface SeriesPoint {
  /** Unix seconds. */
  readonly time: number;
  readonly value: number;
}

export interface TooltipRow {
  readonly label: string;
  readonly value: string;
  readonly className?: string | undefined;
}

interface TimeSeriesChartProps {
  /** Accessible description of the chart (the data table follows). */
  readonly label: string;
  readonly points: readonly SeriesPoint[];
  readonly tone: 'brand' | 'loss';
  /** Draw the area down to the minimum (brand) or up to zero (loss). */
  readonly fill: 'below' | 'above';
  /** Formats a value-axis tick with the precision the tick step needs. */
  readonly formatAxis: (value: number, decimals: number) => string;
  readonly tooltip: (point: SeriesPoint) => readonly TooltipRow[];
  /** Times (Unix seconds) to mark on the line, e.g. trade entries. */
  readonly markers?: readonly number[] | undefined;
}

const PAD = { left: 58, right: 10, top: 10, bottom: 22 } as const;
const MAX_DRAWN_POINTS = 700;
const MAX_MARKERS = 400;

function timeTicks(min: number, max: number, count: number): number[] {
  if (max === min) return [min];
  return Array.from(
    { length: count },
    (_, index) => min + ((max - min) * index) / (count - 1)
  );
}

/**
 * Dependency-free SVG time series with a gradient line, crosshair tooltip
 * (pointer and arrow keys) and optional markers.
 */
export function TimeSeriesChart({
  label,
  points,
  tone,
  fill,
  formatAxis,
  tooltip,
  markers = [],
}: TimeSeriesChartProps) {
  const gradientId = useId();
  const areaId = useId();
  const [ref, size] = useElementSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const drawn = useMemo(
    () => downsample(points, MAX_DRAWN_POINTS, (point) => point.value),
    [points]
  );
  const times = useMemo(() => drawn.map((point) => point.time), [drawn]);

  const width = Math.max(0, size.width - PAD.left - PAD.right);
  const height = Math.max(0, size.height - PAD.top - PAD.bottom);
  const first = drawn[0];
  const last = drawn[drawn.length - 1];
  const values = drawn.map((point) => point.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (fill === 'above') max = Math.max(max, 0);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const span = max - min;
  min -= fill === 'above' ? span * 0.06 : span * 0.04;
  if (fill === 'below') max += span * 0.04;

  const valueTicks = niceTicks(min, max, 4);

  const startTime = first?.time ?? 0;
  const timeSpan = Math.max(1, (last?.time ?? 1) - startTime);
  const x = (time: number) =>
    PAD.left + ((time - startTime) / timeSpan) * width;
  const y = (value: number) =>
    PAD.top + (1 - (value - min) / (max - min)) * height;

  const line = drawn
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'}${x(point.time).toFixed(1)},${y(point.value).toFixed(1)}`
    )
    .join('');
  const baseY = fill === 'above' ? y(Math.min(0, max)) : PAD.top + height;
  const area =
    first && last
      ? `${line}L${x(last.time).toFixed(1)},${baseY.toFixed(1)}L${x(first.time).toFixed(1)},${baseY.toFixed(1)}Z`
      : '';
  const color = tone === 'brand' ? 'var(--a1)' : 'var(--loss)';

  const markerPoints = useMemo(() => {
    if (markers.length === 0 || points.length === 0) return [];
    const allTimes = points.map((point) => point.time);
    const step = Math.ceil(markers.length / MAX_MARKERS);
    return markers
      .filter((_, index) => index % step === 0)
      .flatMap((time) => {
        const point = points[nearestIndex(allTimes, time)];
        return point ? [{ time, value: point.value }] : [];
      });
  }, [markers, points]);

  const hovered = hover === null ? null : (drawn[hover] ?? null);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drawn.length === 0 || width <= 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const time =
      startTime + ((event.clientX - bounds.left - PAD.left) / width) * timeSpan;
    setHover(nearestIndex(times, time));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (drawn.length === 0) return;
    const step = event.shiftKey ? 10 : 1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? step : -step;
      setHover((current) =>
        Math.min(
          drawn.length - 1,
          Math.max(0, (current ?? (delta > 0 ? -1 : drawn.length)) + delta)
        )
      );
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setHover(event.key === 'Home' ? 0 : drawn.length - 1);
    } else if (event.key === 'Escape') {
      setHover(null);
    }
  };

  const tooltipRows = hovered ? tooltip(hovered) : [];
  const tooltipLeft = hovered ? x(hovered.time) : 0;
  const flip = tooltipLeft > size.width / 2;

  return (
    <div
      ref={ref}
      tabIndex={0}
      aria-label={`${label}. Flèches gauche et droite pour parcourir les points.`}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setHover(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setHover(null)}
      className={cn('relative h-full w-full touch-none rounded-lg', FOCUS_RING)}
    >
      {size.width > 0 && drawn.length > 1 ? (
        <svg
          width={size.width}
          height={size.height}
          className="block overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
              <stop
                offset="0%"
                stopColor={tone === 'brand' ? 'var(--a1)' : 'var(--loss)'}
              />
              <stop
                offset="100%"
                stopColor={tone === 'brand' ? 'var(--a2)' : 'var(--loss)'}
              />
            </linearGradient>
            <linearGradient
              id={areaId}
              x1="0"
              x2="0"
              y1={fill === 'below' ? '0' : '1'}
              y2={fill === 'below' ? '1' : '0'}
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {valueTicks.values.map((value) => (
            <g key={value}>
              <line
                x1={PAD.left}
                x2={PAD.left + width}
                y1={y(value)}
                y2={y(value)}
                stroke="var(--line-2)"
              />
              <text
                x={PAD.left - 8}
                y={y(value) + 3.5}
                textAnchor="end"
                className="fill-fg-3 font-mono text-[10.5px]"
              >
                {formatAxis(value, valueTicks.decimals)}
              </text>
            </g>
          ))}
          {timeTicks(
            startTime,
            startTime + timeSpan,
            Math.max(2, Math.min(5, Math.floor(width / 120)))
          ).map((time, index, all) => (
            <text
              key={time}
              x={x(time)}
              y={PAD.top + height + 16}
              textAnchor={
                index === 0
                  ? 'start'
                  : index === all.length - 1
                    ? 'end'
                    : 'middle'
              }
              className="fill-fg-3 font-mono text-[10.5px]"
            >
              {formatDay(time)}
            </text>
          ))}
          <path d={area} fill={`url(#${areaId})`} />
          <path
            d={line}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {markerPoints.map((marker) => (
            <circle
              key={marker.time}
              cx={x(marker.time)}
              cy={y(marker.value)}
              r={3}
              fill="var(--gain)"
              stroke="var(--surface)"
              strokeWidth={1.5}
            />
          ))}
          {hovered ? (
            <g>
              <line
                x1={x(hovered.time)}
                x2={x(hovered.time)}
                y1={PAD.top}
                y2={PAD.top + height}
                stroke="var(--line-strong)"
                strokeDasharray="3 3"
              />
              <circle
                cx={x(hovered.time)}
                cy={y(hovered.value)}
                r={4.5}
                fill={tone === 'brand' ? 'var(--a2)' : 'var(--loss)'}
                stroke="var(--surface)"
                strokeWidth={2}
              />
            </g>
          ) : null}
        </svg>
      ) : null}
      {hovered ? (
        <div
          role="status"
          className="pointer-events-none absolute top-2 z-[3] min-w-[160px] rounded-[11px] border border-line-strong bg-[color-mix(in_srgb,var(--raised)_88%,transparent)] px-[11px] py-[9px] text-[11.5px] shadow-[var(--shadow-2)] backdrop-blur-[10px]"
          // Follows the crosshair: a computed pixel position.
          style={
            flip
              ? { right: size.width - tooltipLeft + 12 }
              : { left: tooltipLeft + 12 }
          }
        >
          <div className="font-mono text-[10.5px] font-medium tracking-[0.02em] text-fg-3">
            {formatDay(hovered.time)}
          </div>
          {tooltipRows.map((row) => (
            <div key={row.label} className="mt-1 flex justify-between gap-3.5">
              <span className="text-fg-2">{row.label}</span>
              <b className={cn('font-mono font-semibold', row.className)}>
                {row.value}
              </b>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface ChartDataTableProps {
  readonly caption: string;
  readonly headers: readonly string[];
  readonly rows: readonly (readonly ReactNode[])[];
}

/** Visually hidden table mirroring a canvas/SVG chart for screen readers. */
export function ChartDataTable({
  caption,
  headers,
  rows,
}: ChartDataTableProps) {
  return (
    <div role="region" aria-label={caption} className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
