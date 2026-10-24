'use client';

import type { ChartOptions, DeepPartial } from 'lightweight-charts';
import { useMemo } from 'react';

import { useBacktest } from '@/features/run-backtest/BacktestProvider';
import { useAppearance } from '@/shared/theme';
import { DynamicLightweightChart } from '@/shared/ui/charts/DynamicLightweightChart';

import { useResultControls } from '../model/ResultControls';
import { EmptyState } from './EmptyState';

export function EquityWidget() {
  const { result, status } = useBacktest();
  const { range } = useResultControls();
  const { theme, colorblindMode } = useAppearance();
  const series = useMemo(
    () => ({
      nav: result.equity.map((point) => ({
        time: point.time,
        value: point.nav,
      })),
      benchmark: result.equity.map((point) => ({
        time: point.time,
        value: point.benchmark,
      })),
    }),
    [result]
  );
  const options = useMemo<DeepPartial<ChartOptions>>(
    () => ({
      layout: {
        textColor: theme === 'dark' ? '#a1a1aa' : '#52525b',
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: {
          color: theme === 'dark' ? '#202124' : '#e3e4e8',
          style: 0,
        },
      },
      rightPriceScale: { visible: false },
      leftPriceScale: {
        visible: true,
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: range === '1D',
        rightOffset: 0,
        minBarSpacing: 0.01,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      localization: {
        priceFormatter: (price: number) =>
          new Intl.NumberFormat('en-US', {
            notation: 'compact',
            maximumFractionDigits: 1,
          }).format(price),
      },
    }),
    [theme, range]
  );
  const seriesOptions = useMemo(
    () => ({
      color:
        colorblindMode === 'orange-blue'
          ? theme === 'dark'
            ? '#65b8ff'
            : '#155eb8'
          : theme === 'dark'
            ? '#527dff'
            : '#305ad4',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    }),
    [theme, colorblindMode]
  );
  const visibleRange = useMemo(() => {
    if (range === 'ALL' || !result.equity.length) return null;
    const days = { '1D': 1, '1W': 7, '1M': 30, '1Y': 365 }[range];
    const to = result.equity[result.equity.length - 1].time;
    return { from: Math.max(result.equity[0].time, to - days * 86400), to };
  }, [result, range]);
  if (!result.equity.length)
    return <EmptyState message="No equity data for this backtest." />;
  return (
    <div className="lab-equity-body" aria-busy={status === 'running'}>
      <div className="lab-chart-legend">
        <span>
          <i />
          Strategy NAV
        </span>
        <span>
          <i />
          Benchmark (SPX)
        </span>
      </div>
      <div className="lab-chart">
        <DynamicLightweightChart
          data={series.nav}
          comparisonData={series.benchmark}
          comparisonLabel="Benchmark (SPX)"
          visibleRange={visibleRange}
          seriesType="line"
          ariaLabel="Strategy NAV and SPX benchmark; latest 25 observations"
          options={options}
          seriesOptions={seriesOptions}
        />
      </div>
    </div>
  );
}
