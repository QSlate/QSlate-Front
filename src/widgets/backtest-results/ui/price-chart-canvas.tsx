'use client';

import type { IChartApi, Time, UTCTimestamp } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

import type { Candle } from '@/entities/dataset';

import type { PriceMarker } from '../model/price-markers';
import {
  candleBar,
  type CandlestickChart,
  createCandlestickChart,
  markerShape,
  volumeBar,
} from './candlestick-chart';

export interface PriceChartCanvasProps {
  readonly candles: readonly Candle[];
  readonly markers: readonly PriceMarker[];
  /** Visible span in seconds ending on the last candle; null shows all. */
  readonly spanSeconds: number | null;
  /** Candle under the crosshair (null when the pointer leaves). */
  readonly onHover: (candle: Candle | null) => void;
}

function showSpan(
  chart: IChartApi,
  candles: readonly Candle[],
  spanSeconds: number | null
) {
  const last = candles[candles.length - 1];
  const first = candles[0];
  if (!last || !first) return;
  if (spanSeconds === null || last.time - spanSeconds <= first.time) {
    chart.timeScale().fitContent();
    return;
  }
  chart.timeScale().setVisibleRange({
    from: (last.time - spanSeconds) as UTCTimestamp,
    to: last.time as UTCTimestamp,
  });
}

/**
 * Candlesticks with volume and trade markers over the whole run. Browser
 * only: load it through `next/dynamic` with `ssr: false`.
 */
export function PriceChartCanvas({
  candles,
  markers,
  spanSeconds,
  onHover,
}: PriceChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<CandlestickChart | null>(null);
  const hoverRef = useRef(onHover);
  const dataRef = useRef({ candles, markers, spanSeconds });

  useEffect(() => {
    hoverRef.current = onHover;
    dataRef.current = { candles, markers, spanSeconds };
  });

  // Chart instance: created once, destroyed on unmount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handle = createCandlestickChart(container, {
      onRetheme: ({ volume, markers: plugin, palette }) => {
        const { candles: data, markers: marks } = dataRef.current;
        volume.setData(data.map((candle) => volumeBar(candle, palette())));
        plugin.setMarkers(marks.map((mark) => markerShape(mark, palette())));
      },
      // "Tout" would otherwise fit a zero-width chart.
      onSized: ({ chart }) =>
        showSpan(chart, dataRef.current.candles, dataRef.current.spanSeconds),
    });
    chartRef.current = handle;

    const byTime = new Map<number, Candle>();
    const handleCrosshair = (param: { time?: Time | undefined }) => {
      if (byTime.size !== dataRef.current.candles.length) {
        byTime.clear();
        for (const candle of dataRef.current.candles)
          byTime.set(candle.time, candle);
      }
      const time = typeof param.time === 'number' ? param.time : null;
      hoverRef.current(time === null ? null : (byTime.get(time) ?? null));
    };
    handle.chart.subscribeCrosshairMove(handleCrosshair);

    return () => {
      handle.chart.unsubscribeCrosshairMove(handleCrosshair);
      handle.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handle = chartRef.current;
    if (!handle) return;
    const palette = handle.palette();
    handle.candles.setData(candles.map(candleBar));
    handle.volume.setData(candles.map((candle) => volumeBar(candle, palette)));
    handle.markers.setMarkers(
      markers.map((marker) => markerShape(marker, palette))
    );
  }, [candles, markers]);

  useEffect(() => {
    const handle = chartRef.current;
    if (handle) showSpan(handle.chart, candles, spanSeconds);
  }, [candles, spanSeconds]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 font-mono"
    />
  );
}
