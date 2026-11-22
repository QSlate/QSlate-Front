'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type BacktestJobStatus,
  type BacktestMetrics,
  type BacktestRunRequest,
  parseMetrics,
  toBacktestRunPayload,
  toJobSnapshot,
} from '@/entities/backtest';
import { apiClient, type OptimizationBatch } from '@/shared/api';

import type { OptimizationMethod } from '../model/search-space';

const POLL_MS = 2_000;

export interface StartOptimizationInput {
  readonly request: BacktestRunRequest;
  readonly method: OptimizationMethod;
  readonly searchSpace: Record<string, number[]>;
  readonly maxRuns: number;
}

/** POST /backtests/optimize: one child backtest per trial. */
export function useStartOptimization() {
  return useMutation({
    mutationFn: ({
      request,
      method,
      searchSpace,
      maxRuns,
    }: StartOptimizationInput) =>
      apiClient.optimizeBacktest({
        run: toBacktestRunPayload(request),
        method,
        search_space: searchSpace,
        max_runs: maxRuns,
      }),
  });
}

export interface OptimizationTrial {
  readonly backtestId: string;
  /** Parameters actually sent to the engine for this trial. */
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly status: BacktestJobStatus;
  readonly progress: number | null;
  readonly error: string | null;
  /** Summary metrics once the trial completed. */
  readonly metrics: BacktestMetrics | null;
}

function isDone(status: BacktestJobStatus): boolean {
  return (
    status === 'completed' || status === 'failed' || status === 'cancelled'
  );
}

/**
 * Follows the trials of an optimization through their own status and,
 * once completed, their real /summary.
 */
export function useOptimizationTrials(batch: OptimizationBatch | null) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: [
      'backtests',
      'optimization',
      batch?.optimization_id ?? '',
    ] as const,
    enabled: batch !== null,
    queryFn: async (): Promise<readonly OptimizationTrial[]> =>
      Promise.all(
        (batch?.backtests ?? []).map(async (child) => {
          const job = toJobSnapshot(
            await apiClient.getBacktestStatus(child.backtest_id)
          );
          const metrics =
            job.status === 'completed'
              ? await queryClient.fetchQuery({
                  queryKey: [
                    'backtests',
                    'summary',
                    child.backtest_id,
                  ] as const,
                  queryFn: async () =>
                    parseMetrics(
                      (await apiClient.getBacktestSummary(child.backtest_id))
                        .metrics
                    ),
                  staleTime: Infinity,
                })
              : null;
          return {
            backtestId: child.backtest_id,
            parameters: child.input.parameters ?? {},
            status: job.status,
            progress: job.progress,
            error: job.error,
            metrics,
          };
        })
      ),
    refetchInterval: (query) =>
      query.state.data &&
      query.state.data.every((trial) => isDone(trial.status))
        ? false
        : POLL_MS,
  });
}
