import { describe, expect, it } from 'vitest';

import { finishedRunFromJob } from '../BacktestProvider';

describe('finishedRunFromJob', () => {
  it('uses the stored job times and settings', () => {
    expect(
      finishedRunFromJob({
        backtest_id: 'bt',
        status: 'completed',
        progress: 100,
        input: {
          strategy_id: 's',
          dataset_id: 'd',
          initial_capital: '10000',
          commission_rate: 0.001,
        },
        created_at: '2026-11-22T10:00:00Z',
        updated_at: '2026-11-22T10:00:18Z',
      })
    ).toEqual({
      backtestId: 'bt',
      startedAt: Date.parse('2026-11-22T10:00:00Z'),
      finishedAt: Date.parse('2026-11-22T10:00:18Z'),
      descriptor: {
        strategyId: 's',
        datasetId: 'd',
        initialCapital: 10000,
        commissionRate: 0.001,
      },
    });
  });
});
