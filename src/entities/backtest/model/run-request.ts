import type { BacktestRunPayload } from '@/shared/api';

export type StrategyParameterValue = string | number | boolean;

/** Everything the lab service needs to enqueue one reproducible backtest. */
export interface BacktestRunRequest {
  readonly strategyId: string;
  readonly strategyVersionId: string;
  readonly datasetId: string;
  readonly datasetVersionId: string;
  /** Initial capital in USD. */
  readonly initialCapital: number;
  /** Only the parameters that differ from the strategy's saved defaults. */
  readonly parameters: Readonly<Record<string, StrategyParameterValue>>;
  /** Warm-up bars before the first signal. */
  readonly window: number;
  /** Fee per trade as a fraction of the notional (0.001 = 0.1 %). */
  readonly commissionRate: number;
  /** Slippage in basis points. */
  readonly slippageBps: number;
}

/** Defaults and bounds of the run contract (RunInput in the OpenAPI spec). */
export const RUN_LIMITS = {
  window: { default: 20, min: 1, max: 10_000 },
  commissionRate: { default: 0, min: 0, max: 0.1 },
  slippageBps: { default: 0, min: 0, max: 1_000 },
  initialCapital: { min: 0, max: 1_000_000_000_000 },
} as const;

/** Maps a run request to the exact JSON body of POST /backtests/run. */
export function toBacktestRunPayload(
  request: BacktestRunRequest
): BacktestRunPayload {
  const parameters = { ...request.parameters };
  return {
    strategy_id: request.strategyId,
    strategy_version_id: request.strategyVersionId,
    dataset_id: request.datasetId,
    dataset_version_id: request.datasetVersionId,
    // Decimal string required by the contract (^[0-9]+(\.[0-9]+)?$).
    initial_capital: request.initialCapital.toFixed(2),
    ...(Object.keys(parameters).length > 0 ? { parameters } : {}),
    window: request.window,
    commission_rate: request.commissionRate,
    slippage_bps: request.slippageBps,
  };
}
