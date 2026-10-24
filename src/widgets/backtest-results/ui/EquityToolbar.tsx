'use client';

import { CandlestickChart, LineChart } from 'lucide-react';

import { useBacktest } from '@/features/run-backtest/BacktestProvider';

import { signed } from '../model/format';
import {
  CANDLE_INTERVALS,
  EQUITY_RANGES,
  useResultControls,
} from '../model/ResultControls';
import { TickerSelector } from './TickerSelector';

export function EquityToolbar() {
  const { result } = useBacktest();
  const {
    range,
    setRange,
    chartMode,
    setChartMode,
    selectedTicker,
    setSelectedTicker,
    candleInterval,
    setCandleInterval,
    showEMA21,
    setShowEMA21,
    showEMA55,
    setShowEMA55,
  } = useResultControls();

  return (
    <div className="lab-equity-toolbar flex items-center gap-2 flex-wrap">
      {/* Mode Switcher: Candlestick (TradingView) vs Strategy NAV */}
      <div
        className="flex items-center p-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono"
        role="group"
        aria-label="Chart mode"
      >
        <button
          type="button"
          onClick={() => setChartMode('candles')}
          aria-pressed={chartMode === 'candles'}
          className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
            chartMode === 'candles'
              ? 'bg-blue-600 text-white font-medium shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
          title="Switch to TradingView Candlestick chart"
        >
          <CandlestickChart size={11} />
          <span>Candles</span>
        </button>

        <button
          type="button"
          onClick={() => setChartMode('nav')}
          aria-pressed={chartMode === 'nav'}
          className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
            chartMode === 'nav'
              ? 'bg-blue-600 text-white font-medium shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
          title="Switch to Strategy NAV equity curve"
        >
          <LineChart size={11} />
          <span>Strategy NAV</span>
        </button>
      </div>

      {chartMode === 'candles' ? (
        <>
          {/* Ticker Selector Dropdown */}
          <TickerSelector
            selectedTicker={selectedTicker}
            onSelect={setSelectedTicker}
          />

          {/* Candle Interval Buttons */}
          <div
            className="lab-ranges"
            role="group"
            aria-label="Candlestick interval"
          >
            {CANDLE_INTERVALS.map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={candleInterval === value}
                onClick={() => setCandleInterval(value)}
              >
                {value}
              </button>
            ))}
          </div>

          {/* Technical Overlays Toggle */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setShowEMA21((prev) => !prev)}
              aria-pressed={showEMA21}
              className={`px-1.5 py-0.5 rounded border transition-colors ${
                showEMA21
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
              title="Toggle 21 EMA"
            >
              EMA 21
            </button>
            <button
              type="button"
              onClick={() => setShowEMA55((prev) => !prev)}
              aria-pressed={showEMA55}
              className={`px-1.5 py-0.5 rounded border transition-colors ${
                showEMA55
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
              title="Toggle 55 EMA"
            >
              EMA 55
            </button>
          </div>
        </>
      ) : (
        <>
          <span
            className={`lab-oos ${result.oosReturn >= 0 ? 'lab-positive' : 'lab-negative'}`}
          >
            {signed(result.oosReturn)}% OOS
          </span>
          <div
            className="lab-ranges"
            role="group"
            aria-label="Equity chart time range"
          >
            {EQUITY_RANGES.map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={range === value}
                onClick={() => setRange(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
