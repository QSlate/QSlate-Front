'use client';

import { formatDatasetLabel, useRunDatasets } from '@/entities/dataset';
import { useStrategies } from '@/entities/strategy';
import type { RunDescriptor } from '@/features/run-backtest';

const AMOUNT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

/** "RsiTrend · ETH / USDT · 1 h · 10 000 USD": which run the results show. */
export function useRunSummary(request: RunDescriptor | null): string | null {
  const strategies = useStrategies();
  const datasets = useRunDatasets();
  if (!request) return null;
  const dataset = datasets.data?.find((item) => item.id === request.datasetId);
  const strategy = strategies.data?.find(
    (item) => item.id === request.strategyId
  );
  return [
    strategy?.name,
    dataset ? formatDatasetLabel(dataset) : undefined,
    request.initialCapital === null
      ? undefined
      : `${AMOUNT.format(request.initialCapital)} USD`,
  ]
    .filter(Boolean)
    .join(' · ');
}
