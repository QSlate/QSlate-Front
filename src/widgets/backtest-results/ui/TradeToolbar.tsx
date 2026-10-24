'use client';
import { useBacktest } from '@/features/run-backtest/BacktestProvider';

export function TradeToolbar() {
  const { result } = useBacktest();
  return (
    <span
      className="lab-simulated"
      title={
        result.source === 'mock'
          ? 'Local demo data; no live connection'
          : 'Completed backtest trades'
      }
    >
      <i className="lab-status-dot" />
      {result.source === 'mock' ? 'SIMULATED' : 'BACKTEST'}
    </span>
  );
}
