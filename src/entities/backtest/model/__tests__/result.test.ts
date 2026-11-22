import { describe, expect, it } from 'vitest';

import {
  computeMonthlyReturns,
  computeReturnHistogram,
  parseMetrics,
} from '../result';

const DAY = 86_400;
const JAN_1 = Date.parse('2024-01-01T00:00:00Z') / 1_000;

describe('backtest result model', () => {
  it('keeps unreported metrics null', () => {
    const metrics = parseMetrics({ return_pct: 0, sharpe_ratio: 'x' });
    expect(metrics.returnPct).toBe(0);
    expect(metrics.sharpe).toBeNull();
    expect(metrics.maxDrawdownPct).toBeNull();
  });

  it('chains monthly returns from the previous month close', () => {
    const months = computeMonthlyReturns([
      { time: JAN_1, equity: 100, drawdownPct: 0 },
      { time: JAN_1 + 30 * DAY, equity: 110, drawdownPct: 0 },
      { time: JAN_1 + 45 * DAY, equity: 99, drawdownPct: -10 },
    ]);
    expect(
      months.map((month) => [month.month, Number(month.returnPct.toFixed(2))])
    ).toEqual([
      [0, 10],
      [1, -10],
    ]);
  });

  it('bins trade returns with zero on an edge', () => {
    const bins = computeReturnHistogram([-2.5, -0.5, 0.5, 1, 3]);
    expect(bins.reduce((total, bin) => total + bin.count, 0)).toBe(5);
    expect(bins.some((bin) => bin.from === 0 || bin.to === 0)).toBe(true);
    expect(computeReturnHistogram([])).toEqual([]);
  });
});
