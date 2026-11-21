'use client';
import { useBacktest } from '@/features/run-backtest/BacktestProvider';

export function TradeToolbar() {
  const { result } = useBacktest();
  if (!result.id) return null;
  return (
    <span className="lab-simulated" title="Completed backtest trades">
      <i className="lab-status-dot" />
      BACKTEST
    </span>
  );
}
