'use client';

import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  CrosshairMode,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  LineStyle,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import { useEffect, useRef } from 'react';

import type { Candle } from '@/entities/dataset';

import type { PriceMarker } from '../model/price-markers';

export interface PriceChartCanvasProps {
  readonly candles: readonly Candle[];
  readonly markers: readonly PriceMarker[];
  /** Visible span in seconds ending on the last candle; null shows all. */
  readonly spanSeconds: number | null;
  /** Candle under the crosshair (null when the pointer leaves). */
  readonly onHover: (candle: Candle | null) => void;
}

interface Palette {
  readonly gain: string;
  readonly loss: string;
  readonly text: string;
  readonly grid: string;
  readonly crosshair: string;
  readonly font: string;
}

/** "#2ee6a6" + 0.35 → "rgba(46, 230, 166, 0.35)"; other formats unchanged. */
function withAlpha(color: string, alpha: number): string {
  const match = /^#([0-9a-f]{6})$/iu.exec(color.trim());
  if (!match?.[1]) return color;
  const value = Number.parseInt(match[1], 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

/** Theme tokens (gain/loss follow the daltonism mode) read from the page. */
function readPalette(element: HTMLElement): Palette {
  const style = getComputedStyle(element);
  const token = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;
  return {
    gain: token('--gain', '#10b981'),
    loss: token('--loss', '#f43f5e'),
    text: token('--fg-3', '#8892a6'),
    grid: token('--line-2', 'rgba(128, 128, 128, 0.12)'),
    crosshair: token('--fg-3', '#8892a6'),
    font: style.fontFamily || 'monospace',
  };
}

function applyPalette(
  chart: IChartApi,
  candleSeries: ISeriesApi<'Candlestick'>,
  palette: Palette
) {
  chart.applyOptions({
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: palette.text,
      fontFamily: palette.font,
      fontSize: 10.5,
      attributionLogo: false,
    },
    grid: {
      vertLines: { color: palette.grid },
      horzLines: { color: palette.grid },
    },
    crosshair: {
      vertLine: { color: palette.crosshair, style: LineStyle.Dashed },
      horzLine: { color: palette.crosshair, style: LineStyle.Dashed },
    },
  });
  candleSeries.applyOptions({
    upColor: palette.gain,
    downColor: palette.loss,
    borderUpColor: palette.gain,
    borderDownColor: palette.loss,
    wickUpColor: palette.gain,
    wickDownColor: palette.loss,
  });
}

function volumeData(candles: readonly Candle[], palette: Palette) {
  return candles.map((candle) => ({
    time: candle.time as UTCTimestamp,
    value: candle.volume,
    color: withAlpha(
      candle.close >= candle.open ? palette.gain : palette.loss,
      0.35
    ),
  }));
}

function markerData(
  markers: readonly PriceMarker[],
  palette: Palette
): SeriesMarker<Time>[] {
  return markers.map((marker) =>
    marker.action === 'buy'
      ? {
          time: marker.time as UTCTimestamp,
          position: 'belowBar',
          shape: 'arrowUp',
          color: palette.gain,
        }
      : {
          time: marker.time as UTCTimestamp,
          position: 'aboveBar',
          shape: 'arrowDown',
          color: palette.loss,
        }
  );
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
 * Lightweight Charts candlesticks with volume and trade markers. Browser
 * only: load it through `next/dynamic` with `ssr: false`.
 */
export function PriceChartCanvas({
  candles,
  markers,
  spanSeconds,
  onHover,
}: PriceChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<{
    chart: IChartApi;
    candles: ISeriesApi<'Candlestick'>;
    volume: ISeriesApi<'Histogram'>;
    markers: ISeriesMarkersPluginApi<Time>;
  } | null>(null);
  const hoverRef = useRef(onHover);
  const dataRef = useRef({ candles, markers, spanSeconds });

  useEffect(() => {
    hoverRef.current = onHover;
    dataRef.current = { candles, markers, spanSeconds };
  });

  // Chart instance: created once, re-themed when <html> theme attributes
  // change (light/dark, daltonism), destroyed on unmount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = createChart(container, {
      autoSize: true,
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true },
      localization: { locale: 'fr-FR' },
    });
    const candleSeries = chart.addSeries(CandlestickSeries, {
      priceLineVisible: false,
    });
    candleSeries
      .priceScale()
      .applyOptions({ scaleMargins: { top: 0.08, bottom: 0.26 } });
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      priceLineVisible: false,
      lastValueVisible: false,
    });
    volumeSeries
      .priceScale()
      .applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    const markerPlugin = createSeriesMarkers(candleSeries, []);
    chartRef.current = {
      chart,
      candles: candleSeries,
      volume: volumeSeries,
      markers: markerPlugin,
    };

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
    chart.subscribeCrosshairMove(handleCrosshair);

    const retheme = () => {
      const palette = readPalette(container);
      applyPalette(chart, candleSeries, palette);
      volumeSeries.setData(volumeData(dataRef.current.candles, palette));
      markerPlugin.setMarkers(markerData(dataRef.current.markers, palette));
    };
    retheme();
    const observer = new MutationObserver(retheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-colorblind', 'class'],
    });

    return () => {
      observer.disconnect();
      chart.unsubscribeCrosshairMove(handleCrosshair);
      markerPlugin.detach();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const current = chartRef.current;
    const container = containerRef.current;
    if (!current || !container) return;
    const palette = readPalette(container);
    current.candles.setData(
      candles.map((candle) => ({
        time: candle.time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }))
    );
    current.volume.setData(volumeData(candles, palette));
    current.markers.setMarkers(markerData(markers, palette));
  }, [candles, markers]);

  useEffect(() => {
    const current = chartRef.current;
    if (current) showSpan(current.chart, candles, spanSeconds);
  }, [candles, spanSeconds]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 font-mono"
    />
  );
}
