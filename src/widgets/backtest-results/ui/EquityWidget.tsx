'use client';

import type { ChartOptions, DeepPartial } from 'lightweight-charts';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

import { MARKET_TICKERS, useMarketCandles } from '@/entities/market';
import { useBacktest } from '@/features/run-backtest/BacktestProvider';
import { useAppearance } from '@/shared/theme';
import { ChartSkeleton } from '@/shared/ui/charts/ChartSkeleton';
import { DynamicLightweightChart } from '@/shared/ui/charts/DynamicLightweightChart';

import { useResultControls } from '../model/ResultControls';
import { EmptyState } from './EmptyState';

const DynamicTradingViewChart = dynamic(
  () =>
    import('./TradingViewRealTimeChart').then(
      (mod) => mod.TradingViewRealTimeChart
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

const QUICK_TICKERS = [
  'ETH/USDT',
  'BTC/USDT',
  'SPX',
  'SPCX',
  'NVDA',
  'SPY',
  'TSLA',
];

export function EquityWidget() {
  const { result, status } = useBacktest();
  const {
    range,
    chartMode,
    selectedTicker,
    setSelectedTicker,
    candleInterval,
  } = useResultControls();
  const { theme, colorblindMode } = useAppearance();
  const isLight = theme === 'light';
  const isColorblind = colorblindMode === 'orange-blue';

  // Candlestick Data for selected ticker & interval from Market Data Service & Live Tick Stream
  const { candles, isLive } = useMarketCandles(selectedTicker, candleInterval);

  const currentTickerInfo = useMemo(() => {
    return (
      MARKET_TICKERS.find((t) => t.symbol === selectedTicker) ?? {
        symbol: selectedTicker,
        name: `${selectedTicker} Live Asset`,
        category: 'Equity' as const,
        exchange: 'TradingView',
        basePrice: 100.0,
        change24h: 0.0,
        change24hPercent: 0.0,
        volume24h: 'Live Feed',
        high24h: 100.0,
        low24h: 100.0,
        decimals: 2,
      }
    );
  }, [selectedTicker]);

  const activeCandle = candles[candles.length - 1];

  // Strategy NAV series
  const series = useMemo(
    () => ({
      nav: (result.equity || [])
        .filter(
          (point) =>
            point && Number.isFinite(point.nav) && Number.isFinite(point.time)
        )
        .map((point) => ({
          time: point.time,
          value: point.nav,
        })),
      benchmark: (result.equity || [])
        .filter(
          (point) =>
            point &&
            Number.isFinite(point.benchmark) &&
            Number.isFinite(point.time)
        )
        .map((point) => ({
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

  const positiveColor = isColorblind ? '#38BDF8' : '#10B981';
  const negativeColor = isColorblind ? '#F59E0B' : '#F43F5E';

  const visibleRange = useMemo(() => {
    if (range === 'ALL' || !result.equity.length) return null;
    const days = { '1D': 1, '1W': 7, '1M': 30, '1Y': 365 }[range];
    const to = result.equity[result.equity.length - 1].time;
    return { from: Math.max(result.equity[0].time, to - days * 86400), to };
  }, [result, range]);

  const navStats = useMemo(() => {
    if (!result.equity.length) return null;
    const first = result.equity[0];
    const last = result.equity[result.equity.length - 1];
    const initialNav = first.nav || result.initialCapital || 0;
    const currentNav = last.nav;
    const netPnl = currentNav - initialNav;
    const returnPct = initialNav > 0 ? (netPnl / initialNav) * 100 : 0;
    const initialBench = first.benchmark || initialNav;
    const currentBench = last.benchmark || initialNav;
    const benchReturnPct =
      initialBench > 0
        ? ((currentBench - initialBench) / initialBench) * 100
        : 0;
    const alphaPct = returnPct - benchReturnPct;

    return {
      currentNav,
      netPnl,
      returnPct,
      benchReturnPct,
      alphaPct,
    };
  }, [result.equity, result.initialCapital]);

  const navAreaOptions = useMemo(
    () => ({
      lineColor: isColorblind
        ? '#38bdf8'
        : theme === 'dark'
          ? '#527dff'
          : '#305ad4',
      topColor: isColorblind
        ? 'rgba(56, 189, 248, 0.28)'
        : theme === 'dark'
          ? 'rgba(82, 125, 255, 0.28)'
          : 'rgba(48, 90, 212, 0.22)',
      bottomColor: 'rgba(82, 125, 255, 0.00)',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    }),
    [theme, isColorblind]
  );

  return (
    <div className="lab-equity-body" aria-busy={status === 'running'}>
      {chartMode === 'candles' ? (
        /* TradingView Candlestick Header HUD */
        <div
          className={`flex flex-col gap-1.5 pb-2 border-b ${
            isLight ? 'border-zinc-200' : 'border-white/[0.04]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono">
            {/* Left: Symbol & Exchange & Live Quote */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-semibold ${
                  isLight ? 'text-zinc-900' : 'text-white'
                }`}
              >
                {currentTickerInfo.symbol}
              </span>
              <span
                className={`text-[10px] px-1 py-0.2 rounded ${
                  isLight
                    ? 'bg-zinc-100 text-zinc-600'
                    : 'bg-white/[0.06] text-zinc-400'
                }`}
              >
                {currentTickerInfo.exchange} · {candleInterval}
              </span>
              {isLive && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              )}
              <span className="text-zinc-400">·</span>
              <span
                className={`font-medium ${
                  isLight ? 'text-zinc-900' : 'text-white'
                }`}
              >
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
                        ? isLight
                          ? 'bg-blue-100 text-blue-700 border border-blue-300 font-semibold'
                          : 'bg-blue-600/30 text-blue-400 border border-blue-500/40 font-semibold'
                        : isLight
                          ? 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
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
            <div
              className={`flex items-center gap-3 text-[11px] font-mono ${
                isLight ? 'text-zinc-600' : 'text-zinc-400'
              }`}
            >
              <span>
                O:{' '}
                <strong className={isLight ? 'text-zinc-900' : 'text-white'}>
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
                <strong className={isLight ? 'text-zinc-900' : 'text-white'}>
                  {activeCandle.close.toFixed(currentTickerInfo.decimals)}
                </strong>
              </span>
              <span className="text-zinc-400">|</span>
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
        /* Strategy NAV Institutional Quant HUD */
        <div
          className={`flex items-center justify-between gap-3 pb-2 border-b flex-wrap font-mono ${
            isLight ? 'border-zinc-200' : 'border-white/[0.04]'
          }`}
        >
          {/* Left: Current NAV & Net PnL Pill */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-sans">
                Portfolio NAV
              </span>
              <span
                className={`text-sm font-semibold tracking-tight ${
                  isLight ? 'text-zinc-900' : 'text-white'
                }`}
              >
                $
                {navStats
                  ? navStats.currentNav.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '100,000.00'}
              </span>
            </div>

            {navStats && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 ${
                  navStats.returnPct >= 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {navStats.returnPct >= 0 ? '+' : ''}$
                {Math.abs(navStats.netPnl).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                ({navStats.returnPct >= 0 ? '+' : ''}
                {navStats.returnPct.toFixed(2)}%)
              </span>
            )}

            {navStats && (
              <div className="hidden md:flex items-center gap-2 text-[10px] text-zinc-400">
                <span>·</span>
                <span>
                  Benchmark (SPX):{' '}
                  <strong
                    className={isLight ? 'text-zinc-800' : 'text-zinc-200'}
                  >
                    {navStats.benchReturnPct >= 0 ? '+' : ''}
                    {navStats.benchReturnPct.toFixed(2)}%
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Alpha:{' '}
                  <strong
                    className={
                      navStats.alphaPct >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }
                  >
                    {navStats.alphaPct >= 0 ? '+' : ''}
                    {navStats.alphaPct.toFixed(2)}%
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Right: Key Performance Badges & Legend */}
          {navStats && (
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-zinc-400">
                  <span className="w-2.5 h-0.5 bg-blue-500 rounded-full inline-block" />
                  Strategy NAV
                </span>
                <span className="flex items-center gap-1 text-zinc-500">
                  <span className="w-2.5 h-0.5 border-t border-dashed border-zinc-400 inline-block" />
                  SPX
                </span>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded border ${
                  isLight
                    ? 'bg-zinc-100 text-zinc-700 border-zinc-200'
                    : 'bg-white/[0.04] text-zinc-300 border-white/10'
                }`}
              >
                Sharpe:{' '}
                <strong className="text-blue-400">
                  {result.metrics.sharpe.toFixed(2)}
                </strong>
              </span>
              <span
                className={`px-1.5 py-0.5 rounded border ${
                  isLight
                    ? 'bg-zinc-100 text-zinc-700 border-zinc-200'
                    : 'bg-white/[0.04] text-zinc-300 border-white/10'
                }`}
              >
                Max DD:{' '}
                <strong className="text-rose-400">
                  {result.metrics.maxDrawdown.toFixed(1)}%
                </strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Primary Chart Area */}
      <div className="lab-chart">
        {chartMode === 'candles' ? (
          <DynamicTradingViewChart
            symbol={selectedTicker}
            interval={candleInterval}
            theme={theme}
          />
        ) : series.nav.length === 0 ? (
          <EmptyState message="No backtest executed yet. Run a backtest to generate your portfolio equity curve." />
        ) : (
          <DynamicLightweightChart
            data={series.nav}
            comparisonData={series.benchmark}
            comparisonLabel="Benchmark (SPX)"
            visibleRange={visibleRange}
            seriesType="area"
            ariaLabel="Strategy NAV and SPX benchmark performance curve"
            options={options}
            seriesOptions={navAreaOptions}
          />
        )}
      </div>
    </div>
  );
}
