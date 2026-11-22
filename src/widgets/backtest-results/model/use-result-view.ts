'use client';

import type { BacktestResult } from '@/entities/backtest';
import { useBacktest } from '@/features/run-backtest';

export type ResultView =
  | { readonly state: 'empty' }
  | { readonly state: 'loading' }
  | { readonly state: 'error' }
  | { readonly state: 'ready'; readonly result: BacktestResult };

/**
 * What a result widget should render: a skeleton while a run is live or a
 * result loads, an empty state without any backtest, otherwise the data.
 */
export function useResultView(): ResultView {
  const { result, resultStatus, status } = useBacktest();
  if (status === 'running' || status === 'cancelling') {
    return { state: 'loading' };
  }
  if (resultStatus === 'loading') return { state: 'loading' };
  if (result) return { state: 'ready', result };
  if (resultStatus === 'error') return { state: 'error' };
  return { state: 'empty' };
}
