import {
  type CandlestickData,
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  CrosshairMode,
  type HistogramData,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  LineStyle,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';

import type { Candle } from '@/entities/dataset';

import { formatPrice } from '../model/format';
import type { PriceMarker } from '../model/price-markers';

export interface ChartPalette {
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
function readPalette(element: HTMLElement): ChartPalette {
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

export function candleBar(candle: Candle): CandlestickData<Time> {
  return {
    time: candle.time as UTCTimestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };
}

export function volumeBar(
  candle: Candle,
  palette: ChartPalette
): HistogramData<Time> {
  return {
    time: candle.time as UTCTimestamp,
    value: candle.volume,
    color: withAlpha(
      candle.close >= candle.open ? palette.gain : palette.loss,
      0.35
    ),
  };
}

export function markerShape(
  marker: PriceMarker,
  palette: ChartPalette
): SeriesMarker<Time> {
  return marker.action === 'buy'
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
      };
}

export interface CandlestickChart {
  readonly chart: IChartApi;
  readonly candles: ISeriesApi<'Candlestick'>;
  readonly volume: ISeriesApi<'Histogram'>;
  readonly markers: ISeriesMarkersPluginApi<Time>;
  /** Current theme colors (re-read on every theme change). */
  readonly palette: () => ChartPalette;
  readonly dispose: () => void;
}

export interface CandlestickChartOptions {
  /** Re-applies the data colors after a theme change. */
  readonly onRetheme: (chart: CandlestickChart) => void;
  /** Called once the container has a real width (autoSize is async). */
  readonly onSized: (chart: CandlestickChart) => void;
}

/**
 * Lightweight Charts candlesticks + volume + markers in the Lab v3 theme,
 * re-themed when <html> theme attributes change (light/dark, daltonism).
 * Browser only.
 */
export function createCandlestickChart(
  container: HTMLElement,
  { onRetheme, onSized }: CandlestickChartOptions
): CandlestickChart {
  const chart = createChart(container, {
    autoSize: true,
    crosshair: { mode: CrosshairMode.Normal },
    rightPriceScale: { borderVisible: false },
    // Hourly years hold ~9 000 bars: allow them to fit the width.
    timeScale: {
      borderVisible: false,
      timeVisible: true,
      minBarSpacing: 0.02,
    },
    // "64 210,5": French separators on the price axis and labels.
    localization: { locale: 'fr-FR', priceFormatter: formatPrice },
  });
  const candles = chart.addSeries(CandlestickSeries, {
    priceLineVisible: false,
  });
  candles
    .priceScale()
    .applyOptions({ scaleMargins: { top: 0.08, bottom: 0.26 } });
  const volume = chart.addSeries(HistogramSeries, {
    priceFormat: { type: 'volume' },
    priceScaleId: '',
    priceLineVisible: false,
    lastValueVisible: false,
  });
  volume.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
  const markers = createSeriesMarkers(candles, []);

  let palette = readPalette(container);
  const handle: CandlestickChart = {
    chart,
    candles,
    volume,
    markers,
    palette: () => palette,
    dispose: () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      markers.detach();
      chart.remove();
    },
  };

  const retheme = () => {
    palette = readPalette(container);
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
    candles.applyOptions({
      upColor: palette.gain,
      downColor: palette.loss,
      borderUpColor: palette.gain,
      borderDownColor: palette.loss,
      wickUpColor: palette.gain,
      wickDownColor: palette.loss,
    });
    onRetheme(handle);
  };
  retheme();

  let sized = false;
  const resizeObserver = new ResizeObserver(([entry]) => {
    if (sized || !entry || entry.contentRect.width === 0) return;
    sized = true;
    requestAnimationFrame(() => onSized(handle));
  });
  resizeObserver.observe(container);
  const themeObserver = new MutationObserver(retheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-colorblind', 'class'],
  });

  return handle;
}
