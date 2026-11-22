import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient, type BacktestJob } from '@/shared/api';

import { BacktestJobError } from '../../model/run-error';
import type { BacktestRunRequest } from '../../model/run-request';
import { LiveBacktestService } from '../liveBacktestService';

const REQUEST: BacktestRunRequest = {
  strategyId: 'strat-1',
  strategyVersionId: 'ver-1',
  datasetId: 'ds-1',
  datasetVersionId: 'dsv-1',
  initialCapital: 100_000,
  parameters: { rsi_period: 21 },
  window: 30,
  commissionRate: 0.001,
  slippageBps: 5,
};

function job(status: BacktestJob['status'], error?: string): BacktestJob {
  return {
    backtest_id: 'bt-job-123',
    status,
    progress: 0,
    input: { strategy_id: 'strat-1', dataset_id: 'ds-1' },
    created_at: '',
    updated_at: '',
    ...(error ? { error } : {}),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LiveBacktestService', () => {
  it('sends exactly the request, polls until completed and loads artifacts', async () => {
    const runSpy = vi
      .spyOn(apiClient, 'runBacktest')
      .mockResolvedValueOnce(job('queued'));
    vi.spyOn(apiClient, 'getBacktestStatus')
      .mockResolvedValueOnce(job('running'))
      .mockResolvedValueOnce(job('completed'));
    vi.spyOn(apiClient, 'getBacktestSummary').mockResolvedValueOnce({
      backtest_id: 'bt-job-123',
      metrics: { sharpe_ratio: 2.34, total_trades: 42 },
    });
    vi.spyOn(apiClient, 'getBacktestTrades').mockResolvedValueOnce({
      items: [],
    });
    vi.spyOn(apiClient, 'getBacktestEquityCurve').mockResolvedValueOnce({
      items: [
        { time: 1704067200, nav: 100000, benchmark: 100000 },
        { time: 1704153600, nav: 102500 },
        { time: 1704240000 },
      ],
    });
    const onAccepted = vi.fn();

    const result = await new LiveBacktestService().run(REQUEST, {
      onAccepted,
    });

    expect(runSpy).toHaveBeenCalledWith({
      strategy_id: 'strat-1',
      strategy_version_id: 'ver-1',
      dataset_id: 'ds-1',
      dataset_version_id: 'dsv-1',
      initial_capital: '100000.00',
      parameters: { rsi_period: 21 },
      window: 30,
      commission_rate: 0.001,
      slippage_bps: 5,
    });
    expect(onAccepted).toHaveBeenCalledWith('bt-job-123');
    expect(result.id).toBe('bt-job-123');
    expect(result.initialCapital).toBe(100_000);
    expect(result.metrics.sharpe).toBe(2.34);
    // Points without a NAV are dropped instead of being invented.
    expect(result.equity).toEqual([
      { time: 1704067200, nav: 100000, benchmark: 100000 },
      { time: 1704153600, nav: 102500, benchmark: 100000 },
    ]);
  });

  it('never creates a strategy nor falls back to hard-coded ids', async () => {
    const createSpy = vi.spyOn(apiClient, 'createStrategy');
    const listSpy = vi.spyOn(apiClient, 'getStrategies');
    const runSpy = vi
      .spyOn(apiClient, 'runBacktest')
      .mockRejectedValueOnce(new Error('API offline'));

    await expect(new LiveBacktestService().run(REQUEST)).rejects.toThrow(
      'API offline'
    );

    expect(createSpy).not.toHaveBeenCalled();
    expect(listSpy).not.toHaveBeenCalled();
    expect(runSpy.mock.calls[0]?.[0]).toMatchObject({
      strategy_id: 'strat-1',
      dataset_id: 'ds-1',
    });
  });

  it('raises a job error when the server reports a failed run', async () => {
    vi.spyOn(apiClient, 'runBacktest').mockResolvedValueOnce(
      job('failed', 'division by zero')
    );

    const failure = new LiveBacktestService().run(REQUEST);

    await expect(failure).rejects.toBeInstanceOf(BacktestJobError);
    await expect(failure).rejects.toMatchObject({
      status: 'failed',
      detail: 'division by zero',
    });
  });

  it('cancels the job on the server when aborted', async () => {
    const abortController = new AbortController();
    vi.spyOn(apiClient, 'runBacktest').mockResolvedValueOnce(job('queued'));
    const cancelSpy = vi
      .spyOn(apiClient, 'cancelBacktest')
      .mockResolvedValueOnce(undefined);
    abortController.abort();

    await expect(
      new LiveBacktestService().run(REQUEST, {
        signal: abortController.signal,
      })
    ).rejects.toThrow('Backtest was cancelled by user');

    expect(cancelSpy).toHaveBeenCalledWith('bt-job-123');
  });
});
