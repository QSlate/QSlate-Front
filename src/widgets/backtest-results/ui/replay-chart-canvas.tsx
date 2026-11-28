'use client';

import { LineStyle, type Time } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

import type { Candle } from '@/entities/dataset';

import { MAX_PRICE_MARKERS, type PriceMarker } from '../model/price-markers';
import {
  candleBar,
  type CandlestickChart,
  createCandlestickChart,
  markerShape,
  volumeBar,
} from './candlestick-chart';

/** Candles in view when the replay starts (the zoom stays the user's). */
const START_WINDOW = 120;
/** Empty bars kept right of the cursor, so the newest candle breathes. */
const RIGHT_OFFSET = 6;
/** Beyond this many new candles, one setData beats candle-by-candle. */
const MAX_INCREMENTAL = 400;

export interface ReplayChartCanvasProps {
  readonly candles: readonly Candle[];
  /** Index of the last revealed candle. */
  readonly cursor: number;
  /** Every order of the run, sorted by candle. */
  readonly markers: readonly PriceMarker[];
  /** Orders revealed at the cursor (a prefix of `markers`). */
  readonly markerCount: number;
  /** Candle under the crosshair (null when the pointer leaves). */
  readonly onHover: (candle: Candle | null) => void;
}

function visibleMarkers(
  handle: CandlestickChart,
  markers: readonly PriceMarker[],
  count: number
) {
  const palette = handle.palette();
  handle.markers.setMarkers(
    markers
      .slice(Math.max(0, count - MAX_PRICE_MARKERS), count)
      .map((marker) => markerShape(marker, palette))
  );
}

/**
 * Candles revealed up to the cursor. Moving forward appends the new bars
 * with `update()`; only a jump (back, scrub) resets the data. Browser
 * only: load it through `next/dynamic` with `ssr: false`.
 */
export function ReplayChartCanvas({
  candles,
  cursor,
  markers,
  markerCount,
  onHover,
}: ReplayChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<CandlestickChart | null>(null);
  /** Index of the last candle drawn on the chart (-1: none). */
  const shownRef = useRef(-1);
  const markerCountRef = useRef(-1);
  const hoverRef = useRef(onHover);
  const dataRef = useRef({ candles, cursor, markers, markerCount });

  useEffect(() => {
    hoverRef.current = onHover;
    dataRef.current = { candles, cursor, markers, markerCount };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handle = createCandlestickChart(container, {
      onRetheme: (chart) => {
        const data = dataRef.current;
        const palette = chart.palette();
        chart.volume.setData(
          data.candles
            .slice(0, shownRef.current + 1)
            .map((candle) => volumeBar(candle, palette))
        );
        visibleMarkers(chart, data.markers, markerCountRef.current);
      },
      onSized: ({ chart }) => {
        const shown = shownRef.current;
        chart.timeScale().setVisibleLogicalRange({
          from: shown - START_WINDOW + 1,
          to: shown + RIGHT_OFFSET,
        });
      },
    });
    handle.chart.applyOptions({
      timeScale: { rightOffset: RIGHT_OFFSET, shiftVisibleRangeOnNewBar: true },
    });
    // The cursor's close, as a dashed line and a label on the price axis.
    handle.candles.applyOptions({
      priceLineVisible: true,
      priceLineStyle: LineStyle.Dashed,
      priceLineWidth: 1,
      lastValueVisible: true,
    });
    chartRef.current = handle;

    const byTime = new Map<number, Candle>();
    const handleCrosshair = (param: { time?: Time | undefined }) => {
      const data = dataRef.current.candles;
      if (byTime.size !== data.length) {
        byTime.clear();
        for (const candle of data) byTime.set(candle.time, candle);
      }
      const time = typeof param.time === 'number' ? param.time : null;
      hoverRef.current(time === null ? null : (byTime.get(time) ?? null));
    };
    handle.chart.subscribeCrosshairMove(handleCrosshair);

    return () => {
      handle.chart.unsubscribeCrosshairMove(handleCrosshair);
      handle.dispose();
      chartRef.current = null;
      shownRef.current = -1;
      markerCountRef.current = -1;
    };
  }, []);

  // A new run: start over from an empty chart.
  useEffect(() => {
    shownRef.current = -1;
    markerCountRef.current = -1;
  }, [candles]);

  useEffect(() => {
    const handle = chartRef.current;
    if (!handle) return;
    const target = Math.min(cursor, candles.length - 1);
    const shown = shownRef.current;
    if (target === shown) return;
    const palette = handle.palette();
    if (target > shown && target - shown <= MAX_INCREMENTAL && shown >= 0) {
      for (let index = shown + 1; index <= target; index += 1) {
        const candle = candles[index];
        if (!candle) break;
        handle.candles.update(candleBar(candle));
        handle.volume.update(volumeBar(candle, palette));
      }
    } else {
      const revealed = candles.slice(0, target + 1);
      handle.candles.setData(revealed.map(candleBar));
      handle.volume.setData(
        revealed.map((candle) => volumeBar(candle, palette))
      );
      // Keep the user's zoom, bring the cursor back to the right edge.
      if (shown >= 0) handle.chart.timeScale().scrollToRealTime();
    }
    shownRef.current = target;
  }, [candles, cursor]);

  useEffect(() => {
    const handle = chartRef.current;
    if (!handle || markerCount === markerCountRef.current) return;
    markerCountRef.current = markerCount;
    visibleMarkers(handle, markers, markerCount);
  }, [markers, markerCount]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 font-mono"
    />
  );
}
