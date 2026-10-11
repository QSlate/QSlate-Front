'use client';

import { useState } from 'react';

import {
  type AreaPointData,
  type ChartSeriesType,
  DynamicLightweightChart,
  type OHLCData,
} from '@/shared/ui/charts';

const MOCK_EQUITY_DATA: AreaPointData[] = [
  { time: '2025-01-02', value: 100000 },
  { time: '2025-01-09', value: 101400 },
  { time: '2025-01-16', value: 100900 },
  { time: '2025-01-23', value: 102800 },
  { time: '2025-01-30', value: 103600 },
  { time: '2025-02-06', value: 102900 },
  { time: '2025-02-13', value: 105400 },
  { time: '2025-02-20', value: 104800 },
  { time: '2025-02-27', value: 106900 },
  { time: '2025-03-06', value: 108300 },
  { time: '2025-03-13', value: 107600 },
  { time: '2025-03-20', value: 109800 },
  { time: '2025-03-27', value: 111500 },
  { time: '2025-04-03', value: 111100 },
  { time: '2025-04-10', value: 113700 },
  { time: '2025-04-17', value: 113100 },
  { time: '2025-04-24', value: 115600 },
  { time: '2025-05-01', value: 117400 },
  { time: '2025-05-08', value: 116800 },
  { time: '2025-05-15', value: 119200 },
  { time: '2025-05-22', value: 120900 },
  { time: '2025-05-29', value: 120200 },
  { time: '2025-06-05', value: 122800 },
  { time: '2025-06-12', value: 122100 },
  { time: '2025-06-19', value: 125300 },
  { time: '2025-06-26', value: 126900 },
  { time: '2025-06-30', value: 129200 },
];

const MOCK_CANDLE_DATA: OHLCData[] = [
  { time: '2025-06-02', open: 121.2, high: 123.5, low: 120.8, close: 122.4 },
  { time: '2025-06-05', open: 122.4, high: 124.1, low: 121.5, close: 123.8 },
  { time: '2025-06-09', open: 123.8, high: 125.0, low: 121.1, close: 121.9 },
  { time: '2025-06-12', open: 121.9, high: 124.7, low: 121.0, close: 124.2 },
  { time: '2025-06-16', open: 124.2, high: 126.8, low: 123.9, close: 124.6 },
  { time: '2025-06-19', open: 124.6, high: 127.3, low: 124.1, close: 126.9 },
  { time: '2025-06-23', open: 126.9, high: 128.4, low: 125.2, close: 126.1 },
  { time: '2025-06-26', open: 126.1, high: 129.5, low: 125.8, close: 128.7 },
  { time: '2025-06-30', open: 128.7, high: 130.4, low: 127.9, close: 129.2 },
];

export function EquityCurveWidget() {
  const [chartMode, setChartMode] = useState<ChartSeriesType>('area');

  return (
    <div className="flex h-full flex-col justify-between p-3 bg-[#0a0c12]">
      {/* Metrics Row */}
      <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-white/[0.04]">
        <div>
          <span className="text-lg font-bold font-sans text-white">+29.2%</span>
          <span className="ml-2 text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
            TOTAL RETURN · OUT-OF-SAMPLE
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 rounded border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setChartMode('area')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              chartMode === 'area'
                ? 'bg-signal text-matte font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            NAV
          </button>
          <button
            type="button"
            onClick={() => setChartMode('candlestick')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              chartMode === 'candlestick'
                ? 'bg-signal text-matte font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Candles
          </button>
        </div>
      </div>

      {/* Interactive TradingView Lightweight Chart */}
      <div className="flex-1 min-h-0 h-full w-full mt-1 overflow-hidden relative">
        {chartMode === 'candlestick' ? (
          <DynamicLightweightChart
            data={MOCK_CANDLE_DATA}
            seriesType="candlestick"
            ariaLabel="TradingView Candlestick Price Action Chart"
            title="Asset Price Action (OHLC)"
            height="100%"
          />
        ) : (
          <DynamicLightweightChart
            data={MOCK_EQUITY_DATA}
            seriesType="area"
            ariaLabel="TradingView Portfolio Equity Curve"
            title="Portfolio Strategy NAV"
            height="100%"
          />
        )}
      </div>
    </div>
  );
}
