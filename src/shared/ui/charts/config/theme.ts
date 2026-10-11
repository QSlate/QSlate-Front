import {
  type ChartOptions,
  ColorType,
  CrosshairMode,
  type DeepPartial,
  LineStyle,
} from 'lightweight-charts';

import type { ChartColorblindMode, ChartThemeMode } from '../types';

export interface SeriesColorTokens {
  upColor: string;
  downColor: string;
  borderUpColor: string;
  borderDownColor: string;
  wickUpColor: string;
  wickDownColor: string;
  lineColor: string;
  areaTopColor: string;
  areaBottomColor: string;
  histogramPositiveColor: string;
  histogramNegativeColor: string;
}

export const STANDARD_SERIES_COLORS: SeriesColorTokens = {
  upColor: '#10B981',
  downColor: '#EF4444',
  borderUpColor: '#10B981',
  borderDownColor: '#EF4444',
  wickUpColor: '#10B981',
  wickDownColor: '#EF4444',
  lineColor: '#00E5FF',
  areaTopColor: 'rgba(0, 229, 255, 0.35)',
  areaBottomColor: 'rgba(0, 229, 255, 0.0)',
  histogramPositiveColor: '#10B981',
  histogramNegativeColor: '#EF4444',
};

export const COLORBLIND_SERIES_COLORS: SeriesColorTokens = {
  upColor: '#2563EB',
  downColor: '#F97316',
  borderUpColor: '#2563EB',
  borderDownColor: '#F97316',
  wickUpColor: '#2563EB',
  wickDownColor: '#F97316',
  lineColor: '#38BDF8',
  areaTopColor: 'rgba(56, 189, 248, 0.35)',
  areaBottomColor: 'rgba(56, 189, 248, 0.0)',
  histogramPositiveColor: '#2563EB',
  histogramNegativeColor: '#F97316',
};

export function getSeriesColors(
  colorblindMode: ChartColorblindMode = 'none'
): SeriesColorTokens {
  return colorblindMode === 'orange-blue'
    ? COLORBLIND_SERIES_COLORS
    : STANDARD_SERIES_COLORS;
}

export function getChartThemeOptions(
  theme: ChartThemeMode = 'dark'
): DeepPartial<ChartOptions> {
  const isDark = theme === 'dark';

  return {
    layout: {
      background: {
        type: ColorType.Solid,
        color: isDark ? 'transparent' : '#FFFFFF',
      },
      textColor: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.6)',
      fontFamily: 'var(--font-jetbrains-mono), monospace',
      fontSize: 11,
    },
    grid: {
      vertLines: {
        color: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)',
        style: LineStyle.Dashed,
      },
      horzLines: {
        color: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)',
        style: LineStyle.Dashed,
      },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: {
        color: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
        width: 1,
        style: LineStyle.Dashed,
        labelBackgroundColor: isDark ? '#1F2937' : '#E5E7EB',
      },
      horzLine: {
        color: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
        width: 1,
        style: LineStyle.Dashed,
        labelBackgroundColor: isDark ? '#1F2937' : '#E5E7EB',
      },
    },
    rightPriceScale: {
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)',
      visible: true,
      scaleMargins: {
        top: 0.1,
        bottom: 0.1,
      },
    },
    timeScale: {
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)',
      timeVisible: true,
      secondsVisible: false,
    },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false,
    },
    handleScale: {
      axisPressedMouseMove: true,
      mouseWheel: true,
      pinch: true,
    },
  };
}
