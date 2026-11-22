import type { BacktestRunRequest } from './run-request';

export interface Strategy {
  id: string;
  name: string;
  version: string;
}

export type Timeframe = '15m' | '1h' | '4h' | '1d';

export interface BacktestConfig {
  strategyId: string;
  startDate: string;
  endDate: string;
  timeframe: Timeframe;
  capital: number;
}

export interface EquityPoint {
  time: number;
  nav: number;
  benchmark: number;
}

export interface MonthlyReturn {
  month: string;
  value: number;
}

export interface Trade {
  id: string;
  timestamp: number;
  ticker: string;
  side: 'BUY' | 'SELL';
  /** Price-adjusted units, including the contract multiplier for derivatives. */
  quantity: number;
  entry: number;
  exit: number;
  pnl: number;
  pnlPercent: number;
  slippageMs: number;
  executionHash: string;
}

export interface BacktestMetrics {
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number | null;
  calmar: number | null;
  volatility: number;
  beta: number;
  alpha: number;
  trades: number;
}

export interface BacktestResult {
  id: string;
  source: 'mock' | 'backend';
  /** Initial capital in USD when known (used to rebase the equity curve). */
  initialCapital: number | null;
  equity: EquityPoint[];
  monthlyReturns: MonthlyReturn[];
  trades: Trade[];
  metrics: BacktestMetrics;
  oosReturn: number;
  longestDrawdownDays: number;
}

export type BacktestJobStatus =
  'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

/** Latest known state of a server-side backtest job. */
export interface BacktestJobSnapshot {
  readonly backtestId: string;
  readonly status: BacktestJobStatus;
  /** Completion percentage 0–100 when the server reports it. */
  readonly progress: number | null;
  /** Server error detail for failed jobs. */
  readonly error: string | null;
}

export interface BacktestWatchOptions {
  /** Aborting stops listening (detach); it never cancels the job. */
  readonly signal: AbortSignal;
  readonly onUpdate?: ((job: BacktestJobSnapshot) => void) | undefined;
}

/** Lab service operations used to run and follow a backtest. */
export interface BacktestService {
  submit(request: BacktestRunRequest): Promise<BacktestJobSnapshot>;
  /** Resolves with the terminal snapshot (completed, failed or cancelled). */
  watch(
    backtestId: string,
    options: BacktestWatchOptions
  ): Promise<BacktestJobSnapshot>;
  cancel(backtestId: string): Promise<void>;
  fetchResult(
    backtestId: string,
    initialCapital: number | null
  ): Promise<BacktestResult>;
}

export function isTerminalStatus(status: BacktestJobStatus): boolean {
  return (
    status === 'completed' || status === 'failed' || status === 'cancelled'
  );
}

export const STRATEGIES: Strategy[] = [
  { id: 'momentum-eth', name: 'Momentum_ETH_4h.py', version: 'v3.2' },
  { id: 'mean-reversion', name: 'MeanReversion_BTC.py', version: 'v2.1' },
  { id: 'trend-following', name: 'TrendFollowing_ES.py', version: 'v1.4' },
];

export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  strategyId: 'momentum-eth',
  startDate: '2023-01-01',
  endDate: '2026-06-30',
  timeframe: '1h',
  capital: 100_000,
};

export const EMPTY_BACKTEST_RESULT: BacktestResult = {
  id: '',
  source: 'backend',
  initialCapital: null,
  equity: [],
  monthlyReturns: [],
  trades: [],
  metrics: {
    sharpe: 0,
    sortino: 0,
    maxDrawdown: 0,
    winRate: 0,
    profitFactor: null,
    calmar: null,
    volatility: 0,
    beta: 0,
    alpha: 0,
    trades: 0,
  },
  oosReturn: 0,
  longestDrawdownDays: 0,
};

export type BacktestValidationErrors = Partial<
  Record<keyof BacktestConfig, string>
>;

function isValidDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

export function validateBacktestFields(
  config: BacktestConfig
): BacktestValidationErrors {
  const errors: BacktestValidationErrors = {};

  if (!STRATEGIES.some((strategy) => strategy.id === config.strategyId)) {
    errors.strategyId = 'Select an available strategy.';
  }
  if (!isValidDate(config.startDate)) {
    errors.startDate = 'Enter a valid start date.';
  }
  if (!isValidDate(config.endDate)) {
    errors.endDate = 'Enter a valid end date.';
  }
  if (
    !errors.startDate &&
    !errors.endDate &&
    config.startDate > config.endDate
  ) {
    errors.endDate = 'The end date must be on or after the start date.';
  }
  if (!Number.isFinite(config.capital) || config.capital <= 0) {
    errors.capital = 'Initial capital must be greater than zero.';
  }
  if (!['15m', '1h', '4h', '1d'].includes(config.timeframe)) {
    errors.timeframe = 'Select a valid timeframe.';
  }

  return errors;
}

export function validateBacktest(config: BacktestConfig): string | null {
  return Object.values(validateBacktestFields(config))[0] ?? null;
}
