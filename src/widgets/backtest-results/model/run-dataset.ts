'use client';

import type { BacktestResult } from '@/entities/backtest';
import { type RunDataset, useRunDatasets } from '@/entities/dataset';
import { useBacktest } from '@/features/run-backtest';

const DAY = 86_400;

/** Run period from the equity curve (the candles the engine read). */
export function runRange(
  result: BacktestResult
): { readonly from: number; readonly to: number } | null {
  const first = result.equity[0];
  const last = result.equity[result.equity.length - 1];
  if (!first || !last || last.time <= first.time) return null;
  // `end` is exclusive: include the last candle.
  return { from: first.time, to: last.time + DAY };
}

/** Dataset of the displayed run, at the version the run read. */
export function useRunDataset(): {
  readonly dataset: RunDataset | null;
  readonly known: boolean;
} {
  const { lastRun } = useBacktest();
  const datasets = useRunDatasets();
  const descriptor = lastRun?.descriptor ?? null;
  if (!descriptor) return { dataset: null, known: true };
  const dataset = datasets.data?.find(
    (item) => item.id === descriptor.datasetId
  );
  if (!dataset) return { dataset: null, known: !datasets.isPending };
  return {
    dataset: descriptor.datasetVersionId
      ? { ...dataset, versionId: descriptor.datasetVersionId }
      : dataset,
    known: true,
  };
}
