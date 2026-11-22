'use client';

import type { BacktestRunRequest } from '@/entities/backtest';
import { useStrategies } from '@/entities/strategy';

const AMOUNT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const PERCENT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 });

/** "RsiTrend · 10 000 USD · frais 0,1 %" for a finished run. */
export function useRunSummary(
  request: BacktestRunRequest | null
): string | null {
  const strategies = useStrategies();
  if (!request) return null;
  const strategy = strategies.data?.find(
    (item) => item.id === request.strategyId
  );
  return [
    strategy?.name,
    `${AMOUNT.format(request.initialCapital)} USD`,
    `frais ${PERCENT.format(request.commissionRate * 100)} %`,
  ]
    .filter(Boolean)
    .join(' · ');
}
