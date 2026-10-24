import {
  type BacktestConfig,
  type BacktestResult,
  type BacktestService,
  DEFAULT_BACKTEST_CONFIG,
  type EquityPoint,
  STRATEGIES,
  type Trade,
  validateBacktest,
} from '../model/types';

const DAY = 86_400;
const anchors = [
  0, 0.022, 0.056, 0.05, 0.09, 0.12, 0.075, 0.13, 0.16, 0.185, 0.165, 0.23,
  0.195, 0.208, 0.195, 0.24, 0.26, 0.31, 0.34, 0.325, 0.38,
];

/** Synthetic fixtures only. Real result calculations belong to the backend. */
export function createMockBacktest(input: BacktestConfig): BacktestResult {
  const config = { ...input };
  const error = validateBacktest(config);
  if (error) throw new Error(error);
  const start = Date.parse(config.startDate) / 1000;
  const end = Date.parse(config.endDate) / 1000 + DAY - 1;
  const interval = { '15m': 900, '1h': 3600, '4h': 14400, '1d': DAY }[
    config.timeframe
  ];
  const count = Math.max(
    1,
    Math.min(1284, Math.floor((end - start) / interval) + 1)
  );
  const strategyIndex = STRATEGIES.findIndex(
    (item) => item.id === config.strategyId
  );
  const multiplier = [1, 0.72, 1.18][strategyIndex];
  const equity: EquityPoint[] = Array.from(
    { length: count + 1 },
    (_, index) => {
      const t = index / count;
      const position = t * (anchors.length - 1);
      const left = Math.min(anchors.length - 2, Math.floor(position));
      const trend =
        anchors[left] + (anchors[left + 1] - anchors[left]) * (position - left);
      const noise =
        (Math.sin(index * 1.73 + strategyIndex + interval / 86400) * 0.003 +
          Math.sin(index * 0.39) * 0.006) *
        (index === 0 || index === count ? 0 : 1);
      return {
        time: Math.round(start + t * (end - start)),
        nav: config.capital * (1 + multiplier * (trend + noise)),
        benchmark:
          config.capital *
          (1 +
            0.085 * t +
            0.014 * Math.sin(t * 17) +
            0.004 * Math.sin(index * 0.82) * Math.sin(Math.PI * t)),
      };
    }
  );
  const tickers = ['ES1!', 'NQ1!', 'ETH', 'BTC', 'NQ1!'];
  const trades: Trade[] = equity.slice(1).map((point, index) => {
    const previous = equity[index];
    const pnl = point.nav - previous.nav;
    const side = index % 3 === 0 ? 'SELL' : 'BUY';
    const entry =
      [5379.17, 19906.79, 3221.53, 65360.52, 19340.31][index % 5] *
      (1 + Math.sin(index) * 0.02);
    return {
      id: `mock-${index}`,
      timestamp: point.time,
      ticker: tickers[index % tickers.length],
      side,
      quantity: previous.nav / entry,
      entry,
      exit: entry * (1 + (side === 'BUY' ? 1 : -1) * (pnl / previous.nav)),
      pnl,
      pnlPercent: (pnl / previous.nav) * 100,
      slippageMs: ((index % 9) + 1) / 10,
      executionHash: `0x${(((index + 1) * 2654435761) >>> 0).toString(16).padStart(8, '0')}${(index * 7919).toString(16).padStart(8, '0')}`,
    };
  });
  const monthly = new Map<string, { start: number; end: number }>();
  equity.slice(1).forEach((point, index) => {
    const month = new Date(point.time * 1000).toISOString().slice(0, 7);
    const current = monthly.get(month);
    monthly.set(month, {
      start: current?.start ?? equity[index].nav,
      end: point.nav,
    });
  });
  let peak = equity[0].nav;
  let peakTime = equity[0].time;
  let maxDrawdown = 0;
  let longestDrawdownDays = 0;
  let inDrawdown = false;
  equity.forEach((point) => {
    if (inDrawdown || point.nav < peak) {
      longestDrawdownDays = Math.max(
        longestDrawdownDays,
        Math.round((point.time - peakTime) / DAY)
      );
    }
    inDrawdown = point.nav < peak;
    if (point.nav >= peak) {
      peak = point.nav;
      peakTime = point.time;
    }
    maxDrawdown = Math.min(maxDrawdown, (point.nav / peak - 1) * 100);
  });
  const winners = trades.filter((trade) => trade.pnl > 0);
  const gains = winners.reduce((total, trade) => total + trade.pnl, 0);
  const losses = -trades
    .filter((trade) => trade.pnl < 0)
    .reduce((total, trade) => total + trade.pnl, 0);
  const mean =
    trades.reduce((sum, trade) => sum + trade.pnlPercent, 0) / trades.length;
  const variance =
    trades.reduce((sum, trade) => sum + (trade.pnlPercent - mean) ** 2, 0) /
    trades.length;
  const downside = Math.sqrt(
    trades.reduce((sum, trade) => sum + Math.min(0, trade.pnlPercent) ** 2, 0) /
      trades.length
  );
  const periodsPerYear = count / Math.max(1 / 365, (end - start) / (DAY * 365));
  const volatility = Math.sqrt(variance * periodsPerYear);
  const last = equity[equity.length - 1];
  const years = Math.max(1, (end - start) / (DAY * 365));
  const annualReturn = ((last.nav / config.capital) ** (1 / years) - 1) * 100;
  const benchmarkReturn =
    ((last.benchmark / config.capital) ** (1 / years) - 1) * 100;
  const benchmarkChanges = equity
    .slice(1)
    .map(
      (point, index) => (point.benchmark / equity[index].benchmark - 1) * 100
    );
  const benchmarkMean =
    benchmarkChanges.reduce((sum, value) => sum + value, 0) / count;
  const benchmarkVariance = benchmarkChanges.reduce(
    (sum, value) => sum + (value - benchmarkMean) ** 2,
    0
  );
  const covariance = trades.reduce(
    (sum, trade, index) =>
      sum +
      (trade.pnlPercent - mean) * (benchmarkChanges[index] - benchmarkMean),
    0
  );
  const beta = benchmarkVariance ? covariance / benchmarkVariance : 0;
  return {
    id: `mock-${config.strategyId}-${config.timeframe}-${config.startDate}-${config.endDate}-${config.capital}`,
    source: 'mock',
    config,
    equity,
    monthlyReturns: [...monthly].map(([month, value]) => ({
      month,
      value: (value.end / value.start - 1) * 100,
    })),
    trades: trades.reverse(),
    metrics: {
      sharpe: volatility ? (mean * periodsPerYear) / volatility : 0,
      sortino: downside ? (mean * Math.sqrt(periodsPerYear)) / downside : 0,
      maxDrawdown,
      winRate: (winners.length / trades.length) * 100,
      profitFactor: losses ? gains / losses : null,
      calmar: maxDrawdown ? annualReturn / Math.abs(maxDrawdown) : null,
      volatility,
      beta,
      alpha: annualReturn - beta * benchmarkReturn,
      trades: trades.length,
    },
    oosReturn: (last.nav / equity[Math.floor(count * 0.3)].nav - 1) * 100,
    longestDrawdownDays,
  };
}

export const INITIAL_MOCK_RESULT = createMockBacktest(DEFAULT_BACKTEST_CONFIG);

export const mockBacktestService: BacktestService = {
  async run(config, signal) {
    const submittedConfig = { ...config };
    const error = validateBacktest(submittedConfig);
    if (error) throw new Error(error);
    await new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        reject(new DOMException('Backtest cancelled', 'AbortError'));
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', abort);
        resolve();
      }, 1100);
      if (signal?.aborted) abort();
      else signal?.addEventListener('abort', abort, { once: true });
    });
    signal?.throwIfAborted();
    return createMockBacktest(submittedConfig);
  },
};
