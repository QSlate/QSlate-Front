import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api';

import { DEFAULT_BACKTEST_CONFIG } from '../../model/types';
import { LiveBacktestService } from '../liveBacktestService';

describe('LiveBacktestService', () => {
  it('dispatches runBacktest, polls status until completed, and aggregates backend artifacts', async () => {
    const service = new LiveBacktestService();

    // 1. mock runBacktest
    const runSpy = vi.spyOn(apiClient, 'runBacktest').mockResolvedValueOnce({
      backtest_id: 'bt-job-123',
      status: 'pending',
      progress: 0,
      input: {
        strategy_id: 'strat-1',
        dataset_id: 'binance-eth-4h',
      },
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    });

    // 2. mock getBacktestStatus (running then completed)
    vi.spyOn(apiClient, 'getBacktestStatus')
      .mockResolvedValueOnce({
        backtest_id: 'bt-job-123',
        status: 'running',
        progress: 50,
        input: { strategy_id: 'strat-1', dataset_id: 'binance-eth-4h' },
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      })
      .mockResolvedValueOnce({
        backtest_id: 'bt-job-123',
        status: 'completed',
        progress: 100,
        input: { strategy_id: 'strat-1', dataset_id: 'binance-eth-4h' },
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      });

    // 3. mock summary, trades, equity curve
    vi.spyOn(apiClient, 'getBacktestSummary').mockResolvedValueOnce({
      backtest_id: 'bt-job-123',
      metrics: {
        sharpe_ratio: 2.34,
        return_pct: 28.5,
        max_drawdown_pct: 6.1,
        win_rate_pct: 62.0,
        total_trades: 42,
      },
    });

    vi.spyOn(apiClient, 'getBacktestTrades').mockResolvedValueOnce({
      items: [
        {
          id: 'trade-1',
          symbol: 'ETH',
          side: 'BUY',
          quantity: 2.5,
          entry_price: 2200,
          exit_price: 2350,
          pnl_usd: 375,
          pnl_pct: 6.8,
          slippage_ms: 0.3,
          execution_hash: '0x1234abcd',
        },
      ],
    });

    vi.spyOn(apiClient, 'getBacktestEquityCurve').mockResolvedValueOnce({
      items: [
        { time: 1704067200, nav: 100000, benchmark: 100000 },
        { time: 1704153600, nav: 102500, benchmark: 100800 },
      ],
    });

    const result = await service.run(DEFAULT_BACKTEST_CONFIG);

    expect(runSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        dataset_id: 'binance-eth-4h',
        dataset_version_id: 'v1',
      }),
      undefined,
      null
    );

    expect(result.source).toBe('backend');
    expect(result.id).toBe('bt-job-123');
    expect(result.metrics.sharpe).toBe(2.34);
    expect(result.metrics.trades).toBe(42);
    expect(result.trades).toHaveLength(1);
    expect(result.trades[0]?.ticker).toBe('ETH');
    expect(result.equity).toHaveLength(2);
  });

  it('throws error without fallback to mock if runBacktest network request fails', async () => {
    const service = new LiveBacktestService();

    vi.spyOn(apiClient, 'runBacktest').mockRejectedValueOnce(
      new Error('API offline')
    );

    await expect(service.run(DEFAULT_BACKTEST_CONFIG)).rejects.toThrow(
      'API offline'
    );
  });

  it('aborts backtest and calls cancelBacktest when AbortSignal triggers', async () => {
    const service = new LiveBacktestService();
    const abortController = new AbortController();

    vi.spyOn(apiClient, 'runBacktest').mockResolvedValueOnce({
      backtest_id: 'bt-abort-999',
      status: 'pending',
      progress: 0,
      input: { strategy_id: 's', dataset_id: 'd' },
      created_at: '',
      updated_at: '',
    });

    const cancelSpy = vi
      .spyOn(apiClient, 'cancelBacktest')
      .mockResolvedValueOnce(undefined);

    // trigger abort right away
    abortController.abort();

    await expect(
      service.run(DEFAULT_BACKTEST_CONFIG, abortController.signal)
    ).rejects.toThrow('Backtest was cancelled by user');

    expect(cancelSpy).toHaveBeenCalledWith('bt-abort-999', null);
  });
});
