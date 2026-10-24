'use client';

import type { ChartOptions, DeepPartial } from 'lightweight-charts';
import { useMemo, useState } from 'react';

import {
  generateMockCandles,
  getTechnicalIndicators,
  MARKET_TICKERS,
} from '@/entities/market';
import { useBacktest } from '@/features/run-backtest/BacktestProvider';
import { useAppearance } from '@/shared/theme';
import { DynamicLightweightChart } from '@/shared/ui/charts/DynamicLightweightChart';

import { useResultControls } from '../model/ResultControls';
import { EmptyState } from './EmptyState';

const QUICK_TICKERS = ['ETH/USDT', 'BTC/USDT', 'NVDA', 'SPY', 'SOL/USDT'];

export function EquityWidget() {
  const { result, status } = useBacktest();
  const {
    range,
    chartMode,
    selectedTicker,
    setSelectedTicker,
    candleInterval,
    showEMA21,
  } = useResultControls();
  const { theme, colorblindMode } = useAppearance();
  const isColorblind = colorblindMode === 'orange-blue';

  const [hoveredCandle, setHoveredCandle] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    time: number;
  } | null>(null);

  // Candlestick Data for selected ticker & interval
  const candles = useMemo(() => {
    return generateMockCandles(selectedTicker, candleInterval, 90);
  }, [selectedTicker, candleInterval]);

  const indicators = useMemo(() => {
    return getTechnicalIndicators(candles);
  }, [candles]);

  const currentTickerInfo = useMemo(() => {
    return (
      MARKET_TICKERS.find((t) => t.symbol === selectedTicker) ??
      MARKET_TICKERS[0]
    );
  }, [selectedTicker]);

  const activeCandle = hoveredCandle ?? candles[candles.length - 1];

  // Strategy NAV series
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
        scaleMargins: { top: 0.12, bottom: 0.08 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible:
          range === '1D' || candleInterval === '15m' || candleInterval === '1h',
        rightOffset: 3,
        minBarSpacing: 0.01,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      localization: {
        priceFormatter: (price: number) =>
          new Intl.NumberFormat('en-US', {
            notation: 'compact',
            maximumFractionDigits: currentTickerInfo.decimals,
          }).format(price),
      },
    }),
    [theme, range, candleInterval, currentTickerInfo.decimals]
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

  const positiveColor = isColorblind ? '#38BDF8' : '#10B981';
  const negativeColor = isColorblind ? '#F59E0B' : '#F43F5E';

  return (
    <div className="lab-equity-body" aria-busy={status === 'running'}>
      {chartMode === 'candles' ? (
        /* TradingView Candlestick Header HUD */
        <div className="flex flex-col gap-1.5 pb-2 border-b border-white/[0.04]">
          <div className="flex items-center justify-between text-xs font-mono">
            {/* Left: Symbol & Exchange & Live Quote */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white">
                {currentTickerInfo.symbol}
              </span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-white/[0.06] text-zinc-400">
                {currentTickerInfo.exchange} · {candleInterval}
              </span>
              <span className="text-zinc-500">·</span>
              <span className="text-white font-medium">
                $
                {currentTickerInfo.basePrice.toLocaleString('en-US', {
                  minimumFractionDigits: currentTickerInfo.decimals,
                  maximumFractionDigits: currentTickerInfo.decimals,
                })}
              </span>
              <span
                className="text-[10px] font-semibold"
                style={{
                  color:
                    currentTickerInfo.change24hPercent >= 0
                      ? positiveColor
                      : negativeColor,
                }}
              >
                {currentTickerInfo.change24hPercent >= 0 ? '+' : ''}
                {currentTickerInfo.change24hPercent.toFixed(2)}%
              </span>
            </div>

            {/* Right: Quick Ticker Switch Pills */}
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono">
              <span className="text-zinc-500 mr-1">Quick:</span>
              {QUICK_TICKERS.map((symbol) => {
                const shortLabel = symbol.split('/')[0];
                const isActive = symbol === selectedTicker;
                return (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => setSelectedTicker(symbol)}
                    className={`px-1.5 py-0.5 rounded transition-colors ${
                      isActive
                        ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 font-semibold'
                        : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active OHLC Readout Bar */}
          {activeCandle && (
            <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
              <span>
                O:{' '}
                <strong className="text-white">
                  {activeCandle.open.toFixed(currentTickerInfo.decimals)}
                </strong>
              </span>
              <span>
                H:{' '}
                <strong style={{ color: positiveColor }}>
                  {activeCandle.high.toFixed(currentTickerInfo.decimals)}
                </strong>
              </span>
              <span>
                L:{' '}
                <strong style={{ color: negativeColor }}>
                  {activeCandle.low.toFixed(currentTickerInfo.decimals)}
                </strong>
              </span>
              <span>
                C:{' '}
                <strong className="text-white">
                  {activeCandle.close.toFixed(currentTickerInfo.decimals)}
                </strong>
              </span>
              <span className="text-zinc-500">|</span>
              <span
                className="font-semibold text-[10px]"
                style={{
                  color:
                    activeCandle.close >= activeCandle.open
                      ? positiveColor
                      : negativeColor,
                }}
              >
                {activeCandle.close >= activeCandle.open ? '+' : ''}
                {(
                  ((activeCandle.close - activeCandle.open) /
                    activeCandle.open) *
                  100
                ).toFixed(2)}
                %
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Standard NAV Legend */
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
      )}

      {/* Primary Chart Area */}
      <div className="lab-chart">
        {chartMode === 'candles' ? (
          <DynamicLightweightChart
            data={candles}
            seriesType="candlestick"
            comparisonData={showEMA21 ? indicators.ema21 : undefined}
            comparisonLabel="EMA 21"
            ariaLabel={`Interactive TradingView Candlestick Chart for ${selectedTicker}`}
            options={options}
            seriesOptions={{
              upColor: positiveColor,
              downColor: negativeColor,
              borderUpColor: positiveColor,
              borderDownColor: negativeColor,
              wickUpColor: positiveColor,
              wickDownColor: negativeColor,
            }}
            onCrosshairMove={(param: unknown) => {
              const p = param as {
                seriesData?: Map<
                  unknown,
                  {
                    open?: number;
                    high?: number;
                    low?: number;
                    close?: number;
                    time?: number;
                  }
                >;
              };
              if (!p?.seriesData) return;
              for (const val of p.seriesData.values()) {
                if (
                  val &&
                  typeof val.close === 'number' &&
                  typeof val.open === 'number'
                ) {
                  setHoveredCandle({
                    open: val.open,
                    high: val.high ?? val.close,
                    low: val.low ?? val.open,
                    close: val.close,
                    time: val.time ?? 0,
                  });
                  return;
                }
              }
              setHoveredCandle(null);
            }}
          />
        ) : (
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
        )}
      </div>
    </div>
  );
}
