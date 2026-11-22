import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient, ApiError, type BacktestJob } from '@/shared/api';

import type { BacktestRunRequest } from '../../model/run-request';
import { LiveBacktestService, pollBacktest } from '../liveBacktestService';

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

function job(status: BacktestJob['status'], progress = 0): BacktestJob {
  return {
    backtest_id: 'bt-job-123',
    status,
    progress,
    input: { strategy_id: 'strat-1', dataset_id: 'ds-1' },
    created_at: '',
    updated_at: '',
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('LiveBacktestService', () => {
  it('submits exactly the request and never creates strategies', async () => {
    const createSpy = vi.spyOn(apiClient, 'createStrategy');
    const listSpy = vi.spyOn(apiClient, 'getStrategies');
    const runSpy = vi
      .spyOn(apiClient, 'runBacktest')
      .mockResolvedValueOnce(job('pending'));

    const accepted = await new LiveBacktestService().submit(REQUEST);

    expect(runSpy).toHaveBeenCalledWith({
      strategy_id: 'strat-1',
      strategy_version_id: 'ver-1',
      dataset_id: 'ds-1',
      dataset_version_id: 'dsv-1',
      initial_capital: '100000',
      parameters: { rsi_period: 21 },
      window: 30,
      commission_rate: 0.001,
      slippage_bps: 5,
    });
    expect(accepted).toEqual({
      backtestId: 'bt-job-123',
      status: 'queued',
      progress: 0,
      error: null,
    });
    expect(createSpy).not.toHaveBeenCalled();
    expect(listSpy).not.toHaveBeenCalled();
  });

  it('loads artifacts without inventing equity points', async () => {
    vi.spyOn(apiClient, 'getBacktestSummary').mockResolvedValueOnce({
      backtest_id: 'bt-job-123',
      metrics: { sharpe_ratio: 2.34 },
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

    const result = await new LiveBacktestService().fetchResult(
      'bt-job-123',
      100_000
    );

    expect(result.metrics.sharpe).toBe(2.34);
    expect(result.equity).toEqual([
      { time: 1704067200, nav: 100000, benchmark: 100000 },
      { time: 1704153600, nav: 102500, benchmark: 100000 },
    ]);
  });

  it('cancels through the lab service', async () => {
    const cancelSpy = vi
      .spyOn(apiClient, 'cancelBacktest')
      .mockResolvedValueOnce(undefined);
    await new LiveBacktestService().cancel('bt-job-123');
    expect(cancelSpy).toHaveBeenCalledWith('bt-job-123');
  });
});

describe('pollBacktest', () => {
  it('reports each snapshot and resolves on a terminal status', async () => {
    vi.useFakeTimers();
    vi.spyOn(apiClient, 'getBacktestStatus')
      .mockResolvedValueOnce(job('running', 40))
      .mockResolvedValueOnce(job('completed', 100));
    const onUpdate = vi.fn();

    const done = pollBacktest('bt-job-123', {
      signal: new AbortController().signal,
      onUpdate,
    });
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(done).resolves.toMatchObject({ status: 'completed' });
    expect(onUpdate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ status: 'running', progress: 40 })
    );
  });

  it.each([401, 403, 404])(
    'rethrows a %s immediately instead of retrying',
    async (statusCode) => {
      const spy = vi
        .spyOn(apiClient, 'getBacktestStatus')
        .mockRejectedValue(new ApiError(statusCode, 'x', 'x'));

      await expect(
        pollBacktest('bt', { signal: new AbortController().signal })
      ).rejects.toMatchObject({ statusCode });
      expect(spy).toHaveBeenCalledTimes(1);
    }
  );

  it('retries network and 5xx failures a bounded number of times', async () => {
    vi.useFakeTimers();
    const spy = vi
      .spyOn(apiClient, 'getBacktestStatus')
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValue(new ApiError(503, 'execution_unavailable', 'x'));

    const done = pollBacktest('bt', { signal: new AbortController().signal });
    const assertion = expect(done).rejects.toMatchObject({ statusCode: 503 });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    expect(spy).toHaveBeenCalledTimes(6);
  });

  it('stops listening when aborted, without cancelling the job', async () => {
    const cancelSpy = vi.spyOn(apiClient, 'cancelBacktest');
    vi.spyOn(apiClient, 'getBacktestStatus').mockResolvedValue(job('running'));
    const listen = new AbortController();

    const done = pollBacktest('bt', { signal: listen.signal });
    listen.abort();

    await expect(done).rejects.toMatchObject({ name: 'AbortError' });
    expect(cancelSpy).not.toHaveBeenCalled();
  });
});
