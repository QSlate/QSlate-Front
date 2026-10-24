'use client';

import { useBacktest } from '@/features/run-backtest/BacktestProvider';

export function MetricsWidget() {
  const { result, status } = useBacktest();
  const m = result.metrics;
  const metrics: {
    label: string;
    value: number | null;
    suffix?: string;
    positive?: boolean;
    neutral?: boolean;
    integer?: boolean;
  }[] = [
    { label: 'Sharpe Ratio', value: m.sharpe, positive: m.sharpe > 0 },
    { label: 'Sortino', value: m.sortino, positive: m.sortino > 0 },
    {
      label: 'Max Drawdown',
      value: m.maxDrawdown,
      suffix: '%',
      positive: false,
    },
    { label: 'Win Rate', value: m.winRate, suffix: '%', neutral: true },
    {
      label: 'Profit Factor',
      value: m.profitFactor,
      positive: (m.profitFactor ?? 0) >= 1,
    },
    { label: 'Calmar Ratio', value: m.calmar, positive: (m.calmar ?? 0) > 0 },
    {
      label: 'Volatility (ann.)',
      value: m.volatility,
      suffix: '%',
      neutral: true,
    },
    { label: 'Beta vs SPX', value: m.beta, neutral: true },
    {
      label: 'Alpha (ann.)',
      value: m.alpha,
      suffix: '%',
      positive: m.alpha > 0,
    },
    { label: 'Trades', value: m.trades, neutral: true, integer: true },
  ];
  return (
    <dl className="lab-metrics" aria-busy={status === 'running'}>
      {metrics.map((metric) => (
        <div key={metric.label}>
          <dt>{metric.label}</dt>
          <dd
            className={
              metric.neutral
                ? ''
                : metric.positive
                  ? 'lab-positive'
                  : 'lab-negative'
            }
          >
            {metric.value === null || !Number.isFinite(metric.value)
              ? '—'
              : metric.integer
                ? metric.value.toLocaleString('en-US')
                : `${metric.label === 'Alpha (ann.)' && metric.value > 0 ? '+' : ''}${metric.value.toFixed(metric.suffix ? 1 : 2)}${metric.suffix ?? ''}`}
          </dd>
        </div>
      ))}
    </dl>
  );
}
