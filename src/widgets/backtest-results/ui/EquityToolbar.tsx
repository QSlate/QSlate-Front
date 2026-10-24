'use client';

import { useBacktest } from '@/features/run-backtest/BacktestProvider';

import { signed } from '../model/format';
import { EQUITY_RANGES, useResultControls } from '../model/ResultControls';

export function EquityToolbar() {
  const { result } = useBacktest();
  const { range, setRange } = useResultControls();
  return (
    <div className="lab-equity-toolbar">
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
    </div>
  );
}
