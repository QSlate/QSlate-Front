'use client';

import {
  AreaSeries,
  CandlestickSeries,
  createChart,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  LineSeries,
  type SeriesType,
} from 'lightweight-charts';
import { useEffect, useMemo, useRef } from 'react';

import {
  selectColorblindMode,
  selectTheme,
  useUserStore,
} from '@/entities/user/model';

import {
  getChartThemeOptions,
  getSeriesColors,
  type SeriesColorTokens,
} from './config/theme';
import type {
  ChartDataPoint,
  ChartSeriesType,
  LightweightChartProps,
  OHLCData,
} from './types';

function isOHLCData(point: ChartDataPoint): point is OHLCData {
  return 'open' in point && 'close' in point;
}

function createChartSeries(
  chart: IChartApi,
  seriesType: ChartSeriesType,
  colors: SeriesColorTokens,
  customOptions?: Record<string, unknown>
): ISeriesApi<SeriesType> {
  switch (seriesType) {
    case 'candlestick':
      return chart.addSeries(CandlestickSeries, {
        upColor: colors.upColor,
        downColor: colors.downColor,
        borderUpColor: colors.borderUpColor,
        borderDownColor: colors.borderDownColor,
        wickUpColor: colors.wickUpColor,
        wickDownColor: colors.wickDownColor,
        ...customOptions,
      }) as unknown as ISeriesApi<SeriesType>;

    case 'line':
      return chart.addSeries(LineSeries, {
        color: colors.lineColor,
        lineWidth: 2,
        ...customOptions,
      }) as unknown as ISeriesApi<SeriesType>;

    case 'area':
      return chart.addSeries(AreaSeries, {
        lineColor: colors.lineColor,
        topColor: colors.areaTopColor,
        bottomColor: colors.areaBottomColor,
        lineWidth: 2,
        ...customOptions,
      }) as unknown as ISeriesApi<SeriesType>;

    case 'histogram':
      return chart.addSeries(HistogramSeries, {
        color: colors.histogramPositiveColor,
        ...customOptions,
      }) as unknown as ISeriesApi<SeriesType>;
  }
}

export function LightweightChart<TData extends ChartDataPoint>({
  data,
  seriesType,
  ariaLabel,
  height,
  width,
  autoSize = true,
  options,
  seriesOptions,
  title,
  className,
  theme: themeProp,
  colorblindMode: colorblindModeProp,
}: LightweightChartProps<TData>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const frameIdRef = useRef<number | null>(null);

  const storeTheme = useUserStore(selectTheme);
  const storeColorblindMode = useUserStore(selectColorblindMode);

  const activeTheme = themeProp ?? storeTheme;
  const activeColorblindMode = colorblindModeProp ?? storeColorblindMode;

  const seriesColors = useMemo(
    () => getSeriesColors(activeColorblindMode),
    [activeColorblindMode]
  );

  const accessibleData = useMemo(() => {
    return data.slice(-25);
  }, [data]);

  const initPropsRef = useRef({
    activeTheme,
    seriesColors,
    options,
    seriesOptions,
    data,
    autoSize,
  });

  useEffect(() => {
    initPropsRef.current = {
      activeTheme,
      seriesColors,
      options,
      seriesOptions,
      data,
      autoSize,
    };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const {
      activeTheme: currentTheme,
      seriesColors: currentColors,
      options: currentOptions,
      seriesOptions: currentSeriesOptions,
      data: currentData,
      autoSize: isAutoSize,
    } = initPropsRef.current;

    const initialThemeOptions = getChartThemeOptions(currentTheme);
    const initialWidth = container.clientWidth || 600;
    const initialHeight = container.clientHeight || 300;

    const chart = createChart(container, {
      ...initialThemeOptions,
      width: initialWidth,
      height: initialHeight,
      ...currentOptions,
    });

    chartRef.current = chart;

    const series = createChartSeries(
      chart,
      seriesType,
      currentColors,
      currentSeriesOptions
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    series.setData(currentData as any);
    seriesRef.current = series;

    let resizeObserver: ResizeObserver | null = null;
    if (isAutoSize && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        if (frameIdRef.current !== null) {
          cancelAnimationFrame(frameIdRef.current);
        }

        frameIdRef.current = requestAnimationFrame(() => {
          const entry = entries[0];
          if (!entry || !chartRef.current) return;
          const { width: newWidth, height: newHeight } = entry.contentRect;
          if (newWidth > 0 && newHeight > 0) {
            chartRef.current.applyOptions({
              width: newWidth,
              height: newHeight,
            });
          }
        });
      });

      resizeObserver.observe(container);
    }

    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [seriesType]);

  useEffect(() => {
    if (!seriesRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    seriesRef.current.setData(data as any);
  }, [data]);

  useEffect(() => {
    if (!chartRef.current) return;
    const themeOptions = getChartThemeOptions(activeTheme);
    chartRef.current.applyOptions({
      ...themeOptions,
      ...options,
    });
  }, [activeTheme, options]);

  useEffect(() => {
    if (!seriesRef.current) return;

    switch (seriesType) {
      case 'candlestick':
        seriesRef.current.applyOptions({
          upColor: seriesColors.upColor,
          downColor: seriesColors.downColor,
          borderUpColor: seriesColors.borderUpColor,
          borderDownColor: seriesColors.borderDownColor,
          wickUpColor: seriesColors.wickUpColor,
          wickDownColor: seriesColors.wickDownColor,
          ...seriesOptions,
        });
        break;
      case 'line':
        seriesRef.current.applyOptions({
          color: seriesColors.lineColor,
          ...seriesOptions,
        });
        break;
      case 'area':
        seriesRef.current.applyOptions({
          lineColor: seriesColors.lineColor,
          topColor: seriesColors.areaTopColor,
          bottomColor: seriesColors.areaBottomColor,
          ...seriesOptions,
        });
        break;
      case 'histogram':
        seriesRef.current.applyOptions({
          color: seriesColors.histogramPositiveColor,
          ...seriesOptions,
        });
        break;
    }
  }, [seriesColors, seriesType, seriesOptions]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full min-h-[150px] overflow-hidden ${className ?? ''}`}
      data-testid="lightweight-chart-container"
      style={{
        height: typeof height === 'number' ? `${height}px` : (height ?? '100%'),
        width: typeof width === 'number' ? `${width}px` : (width ?? '100%'),
      }}
    >
      <div
        className="sr-only"
        role="region"
        aria-label={ariaLabel}
        data-testid="chart-sr-table-region"
      >
        <table>
          <caption>{title ?? ariaLabel}</caption>
          <thead>
            {seriesType === 'candlestick' ? (
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Open</th>
                <th scope="col">High</th>
                <th scope="col">Low</th>
                <th scope="col">Close</th>
              </tr>
            ) : (
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Value</th>
              </tr>
            )}
          </thead>
          <tbody>
            {accessibleData.map((item, idx) => {
              if (isOHLCData(item)) {
                return (
                  <tr key={`${item.time}-${idx}`}>
                    <td>{String(item.time)}</td>
                    <td>{item.open}</td>
                    <td>{item.high}</td>
                    <td>{item.low}</td>
                    <td>{item.close}</td>
                  </tr>
                );
              }
              return (
                <tr key={`${item.time}-${idx}`}>
                  <td>{String(item.time)}</td>
                  <td>{'value' in item ? item.value : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
