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
  config: BacktestConfig;
  equity: EquityPoint[];
  monthlyReturns: MonthlyReturn[];
  trades: Trade[];
  metrics: BacktestMetrics;
  oosReturn: number;
  longestDrawdownDays: number;
}

/** Implement this boundary with the backend client when its contract is available. */
export interface BacktestService {
  run(config: BacktestConfig, signal?: AbortSignal): Promise<BacktestResult>;
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
