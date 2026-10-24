'use client';

import {
  AreaSeries,
  CandlestickSeries,
  createChart,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  LineSeries,
  LineStyle,
  type SeriesType,
  type Time,
} from 'lightweight-charts';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAppearance } from '@/shared/theme';

import {
  getChartThemeOptions,
  getSeriesColors,
  type SeriesColorTokens,
} from './config/theme';
import styles from './LightweightChart.module.css';
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
  comparisonData,
  visibleRange,
  onCrosshairMove,
  onTimeRangeChange,
  comparisonLabel = 'Benchmark',
}: LightweightChartProps<TData>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const comparisonRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [tooltip, setTooltip] = useState<{
    time: string;
    value: number;
    comparison?: number;
    data: ChartDataPoint[];
    seriesType: ChartSeriesType;
  } | null>(null);
  const crosshairCallback = useRef(onCrosshairMove);
  const rangeCallback = useRef(onTimeRangeChange);
  useEffect(() => {
    crosshairCallback.current = onCrosshairMove;
    rangeCallback.current = onTimeRangeChange;
  }, [onCrosshairMove, onTimeRangeChange]);

  const { theme: storeTheme, colorblindMode: storeColorblindMode } =
    useAppearance();

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
    visibleRange,
  });

  useEffect(() => {
    initPropsRef.current = {
      activeTheme,
      seriesColors,
      options,
      seriesOptions,
      data,
      autoSize,
      visibleRange,
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
    const fontFamily = getComputedStyle(container)
      .getPropertyValue('--font-jetbrains-mono')
      .trim();
    if (fontFamily && initialThemeOptions.layout)
      initialThemeOptions.layout.fontFamily = `${fontFamily}, monospace`;
    const initialWidth = container.clientWidth || 600;
    const initialHeight = container.clientHeight || 300;

    const chart = createChart(container, {
      ...initialThemeOptions,
      width: initialWidth,
      height: initialHeight,
    });
    if (currentOptions) chart.applyOptions(currentOptions);

    chartRef.current = chart;

    const series = createChartSeries(
      chart,
      seriesType,
      currentColors,
      currentSeriesOptions
    );
    series.setData(
      currentData as Parameters<ISeriesApi<SeriesType>['setData']>[0]
    );
    seriesRef.current = series;
    const handleCrosshair: Parameters<
      IChartApi['subscribeCrosshairMove']
    >[0] = (param) => {
      crosshairCallback.current?.(param);
      const point = param.seriesData.get(series);
      if (
        !param.time ||
        !param.point ||
        param.point.x < 0 ||
        param.point.y < 0 ||
        param.point.x > container.clientWidth ||
        param.point.y > container.clientHeight ||
        !point ||
        !('value' in point)
      ) {
        setTooltip(null);
        return;
      }
      const comparison = comparisonRef.current
        ? param.seriesData.get(comparisonRef.current)
        : undefined;
      const time =
        typeof param.time === 'number'
          ? new Date(param.time * 1000)
              .toISOString()
              .slice(0, 16)
              .replace('T', ' ')
          : typeof param.time === 'string'
            ? param.time
            : `${param.time.year}-${param.time.month}-${param.time.day}`;
      setTooltip({
        time,
        data: initPropsRef.current.data,
        seriesType,
        value: point.value,
        ...(comparison &&
        'value' in comparison &&
        typeof comparison.value === 'number'
          ? { comparison: comparison.value }
          : {}),
      });
    };
    chart.subscribeCrosshairMove(handleCrosshair);
    const handleRangeChange: Parameters<
      ReturnType<IChartApi['timeScale']>['subscribeVisibleTimeRangeChange']
    >[0] = (range) => rangeCallback.current?.(range);
    chart.timeScale().subscribeVisibleTimeRangeChange(handleRangeChange);

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
            const range = initPropsRef.current.visibleRange;
            if (range)
              chartRef.current.timeScale().setVisibleRange({
                from: range.from as Time,
                to: range.to as Time,
              });
            else chartRef.current.timeScale().fitContent();
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
      chart.unsubscribeCrosshairMove(handleCrosshair);
      chart.timeScale().unsubscribeVisibleTimeRangeChange(handleRangeChange);
      chart.remove();
      comparisonRef.current = null;
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [seriesType, autoSize]);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    seriesRef.current.setData(
      data as Parameters<ISeriesApi<SeriesType>['setData']>[0]
    );
  }, [data, seriesType, autoSize]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (!comparisonData) {
      if (comparisonRef.current) chart.removeSeries(comparisonRef.current);
      comparisonRef.current = null;
      return;
    }
    if (!comparisonRef.current)
      comparisonRef.current = chart.addSeries(LineSeries, {
        color: activeTheme === 'dark' ? '#8b9099' : '#626875',
        lineStyle: LineStyle.Dotted,
        lineWidth: 1,
        lastValueVisible: false,
        priceLineVisible: false,
      });
    comparisonRef.current.applyOptions({
      color: activeTheme === 'dark' ? '#8b9099' : '#626875',
    });
    comparisonRef.current.setData(
      comparisonData as { time: Time; value: number }[]
    );
  }, [comparisonData, seriesType, autoSize, activeTheme]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !data.length) return;
    if (visibleRange && visibleRange.from < visibleRange.to)
      chart.timeScale().setVisibleRange({
        from: visibleRange.from as Time,
        to: visibleRange.to as Time,
      });
    else chart.timeScale().fitContent();
  }, [visibleRange, data, seriesType, autoSize]);

  useEffect(() => {
    if (!chartRef.current) return;
    const themeOptions = getChartThemeOptions(activeTheme);
    chartRef.current.applyOptions(themeOptions);
    if (options) chartRef.current.applyOptions(options);
    const fontFamily =
      containerRef.current &&
      getComputedStyle(containerRef.current)
        .getPropertyValue('--font-jetbrains-mono')
        .trim();
    if (fontFamily && !options?.layout?.fontFamily)
      chartRef.current.applyOptions({
        layout: { fontFamily: `${fontFamily}, monospace` },
      });
  }, [activeTheme, options, seriesType, autoSize]);

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
  }, [seriesColors, seriesType, seriesOptions, autoSize]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full min-h-0 overflow-hidden ${className ?? ''}`}
      data-testid="lightweight-chart-container"
      onPointerLeave={() => setTooltip(null)}
      style={{
        height: typeof height === 'number' ? `${height}px` : (height ?? '100%'),
        width: typeof width === 'number' ? `${width}px` : (width ?? '100%'),
      }}
    >
      {tooltip && tooltip.data === data && tooltip.seriesType === seriesType ? (
        <div className={styles.tooltip} aria-hidden="true">
          <span>{tooltip.time} UTC</span>
          <strong>
            {tooltip.value.toLocaleString('en-US', {
              maximumFractionDigits: 2,
            })}
          </strong>
          {tooltip.comparison !== undefined ? (
            <span>
              {comparisonLabel}{' '}
              {tooltip.comparison.toLocaleString('en-US', {
                maximumFractionDigits: 2,
              })}
            </span>
          ) : null}
        </div>
      ) : null}
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
                {comparisonData ? <th scope="col">{comparisonLabel}</th> : null}
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
                  {comparisonData ? (
                    <td>
                      {comparisonData.find((point) => point.time === item.time)
                        ?.value ?? '—'}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
