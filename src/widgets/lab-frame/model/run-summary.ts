'use client';

import type { BacktestRunRequest } from '@/entities/backtest';
import { formatDatasetLabel, useRunDatasets } from '@/entities/dataset';
import { useStrategies } from '@/entities/strategy';

const AMOUNT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const PERCENT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 });

/** "RsiTrend · ETH / USDT · 1 h · 10 000 USD · frais 0,1 %" for a finished run. */
export function useRunSummary(
  request: BacktestRunRequest | null
): string | null {
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
    `${AMOUNT.format(request.initialCapital)} USD`,
    `frais ${PERCENT.format(request.commissionRate * 100)} %`,
  ]
    .filter(Boolean)
    .join(' · ');
}
