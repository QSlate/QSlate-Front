// @vitest-environment jsdom
import { QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient, type BacktestJob } from '@/shared/api';
import { createTestQueryClient } from '@/shared/lib/test';

import { useOptimizationTrials } from '../api/optimization-queries';

function job(
  id: string,
  status: BacktestJob['status'],
  rsi: number
): BacktestJob {
  return {
    backtest_id: id,
    status,
    progress: status === 'completed' ? 100 : 30,
    input: {
      strategy_id: 's',
      dataset_id: 'd',
      parameters: { rsi_period: rsi },
    },
    created_at: '',
    updated_at: '',
  };
}

function wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useOptimizationTrials', () => {
  it('reads each trial status and the real summary of completed ones', async () => {
    vi.spyOn(apiClient, 'getBacktestStatus').mockImplementation(async (id) =>
      id === 'a' ? job('a', 'completed', 10) : job('b', 'running', 20)
    );
    const summary = vi
      .spyOn(apiClient, 'getBacktestSummary')
      .mockResolvedValue({
        backtest_id: 'a',
        metrics: { sharpe_ratio: 1.4, return_pct: 3.2 },
      });
    const { result } = renderHook(
      () =>
        useOptimizationTrials({
          optimization_id: 'o',
          backtests: [job('a', 'queued', 10), job('b', 'queued', 20)],
        }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.data).toHaveLength(2));
    const [first, second] = result.current.data ?? [];
    expect(first).toMatchObject({
      status: 'completed',
      parameters: { rsi_period: 10 },
    });
    expect(first?.metrics?.sharpe).toBe(1.4);
    expect(second?.metrics).toBeNull();
    expect(summary).toHaveBeenCalledTimes(1);
  });
});
