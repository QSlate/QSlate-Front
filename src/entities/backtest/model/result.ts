/** One equity observation (GET /backtests/{id}/equity-curve). */
export interface EquityPoint {
  /** Unix seconds (UTC). */
  readonly time: number;
  readonly equity: number;
  /** Drawdown from the running peak, as a percentage ≤ 0. */
  readonly drawdownPct: number;
}

/** One closed trade (GET /backtests/{id}/trades). */
export interface Trade {
  readonly id: string;
  readonly side: 'long' | 'short';
  /** Unix seconds (UTC). */
  readonly entryTime: number;
  readonly exitTime: number | null;
  readonly entryPrice: number | null;
  readonly exitPrice: number | null;
  readonly sizeUsd: number | null;
  readonly pnlUsd: number | null;
  readonly pnlPct: number | null;
  readonly feeUsd: number | null;
  readonly exitReason: string | null;
}

/** Summary metrics; null when the engine does not report them. */
export interface BacktestMetrics {
  readonly initialCapital: number | null;
  readonly finalCapital: number | null;
  readonly netProfitUsd: number | null;
  readonly returnPct: number | null;
  readonly maxDrawdownPct: number | null;
  readonly maxDrawdownUsd: number | null;
  readonly sharpe: number | null;
  readonly winRatePct: number | null;
  readonly totalTrades: number | null;
  readonly winningTrades: number | null;
  readonly losingTrades: number | null;
  readonly profitFactor: number | null;
  readonly totalFeesUsd: number | null;
}

export interface BacktestResult {
  readonly id: string;
  readonly metrics: BacktestMetrics;
  readonly equity: readonly EquityPoint[];
  readonly trades: readonly Trade[];
  /** True when a bound stopped the artifact pagination early. */
  readonly truncated: boolean;
}

export const EMPTY_METRICS: BacktestMetrics = {
  initialCapital: null,
  finalCapital: null,
  netProfitUsd: null,
  returnPct: null,
  maxDrawdownPct: null,
  maxDrawdownUsd: null,
  sharpe: null,
  winRatePct: null,
  totalTrades: null,
  winningTrades: null,
  losingTrades: null,
  profitFactor: null,
  totalFeesUsd: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Numbers and decimal strings → finite number, anything else → null. */
export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toSeconds(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? Math.floor(time / 1_000) : null;
}

export function parseMetrics(raw: unknown): BacktestMetrics {
  if (!isRecord(raw)) return EMPTY_METRICS;
  const read = (key: string) => toFiniteNumber(raw[key]);
  return {
    initialCapital: read('initial_capital'),
    finalCapital: read('final_capital'),
    netProfitUsd: read('net_profit_usd'),
    returnPct: read('return_pct'),
    maxDrawdownPct: read('max_drawdown_pct'),
    maxDrawdownUsd: read('max_drawdown_usd'),
    sharpe: read('sharpe_ratio'),
    winRatePct: read('win_rate_pct'),
    totalTrades: read('total_trades'),
    winningTrades: read('winning_trades'),
    losingTrades: read('losing_trades'),
    profitFactor: read('profit_factor'),
    totalFeesUsd: read('total_fees_usd'),
  };
}

/** Drops points without a valid time or equity (never invents values). */
export function parseEquityPoints(items: readonly unknown[]): EquityPoint[] {
  return items.flatMap((item) => {
    if (!isRecord(item)) return [];
    const time = toSeconds(item.time ?? item.timestamp);
    const equity = toFiniteNumber(item.equity);
    if (time === null || equity === null) return [];
    const drawdown = toFiniteNumber(item.drawdown) ?? 0;
    // The engine reports drawdown as a positive or negative percentage.
    return [
      { time, equity, drawdownPct: drawdown === 0 ? 0 : -Math.abs(drawdown) },
    ];
  });
}

/** Drops trades without an id-able entry time; missing fields stay null. */
export function parseTrades(items: readonly unknown[]): Trade[] {
  return items.flatMap((item, index) => {
    if (!isRecord(item)) return [];
    const entryTime = toSeconds(item.entry_date ?? item.entry_time);
    if (entryTime === null) return [];
    const side = String(item.side ?? '').toLowerCase();
    return [
      {
        id: typeof item.id === 'string' ? item.id : `trade-${index + 1}`,
        side: side === 'short' || side === 'sell' ? 'short' : 'long',
        entryTime,
        exitTime: toSeconds(item.exit_date ?? item.exit_time),
        entryPrice: toFiniteNumber(item.entry_price),
        exitPrice: toFiniteNumber(item.exit_price),
        sizeUsd: toFiniteNumber(item.size_usd),
        pnlUsd: toFiniteNumber(item.pnl_usd),
        pnlPct: toFiniteNumber(item.pnl_pct),
        feeUsd: toFiniteNumber(item.fee_usd),
        exitReason:
          typeof item.exit_reason === 'string' && item.exit_reason
            ? item.exit_reason
            : null,
      },
    ];
  });
}

export interface MonthlyReturn {
  readonly year: number;
  /** 0 = January. */
  readonly month: number;
  readonly returnPct: number;
}

/**
 * Month-over-month returns from the equity curve: each month compares its
 * last equity to the previous month's last equity (the first month starts
 * from its first point).
 */
export function computeMonthlyReturns(
  equity: readonly EquityPoint[]
): MonthlyReturn[] {
  const closes: { year: number; month: number; first: number; last: number }[] =
    [];
  for (const point of equity) {
    const date = new Date(point.time * 1_000);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const current = closes.at(-1);
    if (current && current.year === year && current.month === month) {
      current.last = point.equity;
    } else {
      closes.push({ year, month, first: point.equity, last: point.equity });
    }
  }
  return closes.flatMap((bucket, index) => {
    const base = index === 0 ? bucket.first : closes[index - 1]?.last;
    if (base === undefined || base <= 0) return [];
    return [
      {
        year: bucket.year,
        month: bucket.month,
        returnPct: ((bucket.last - base) / base) * 100,
      },
    ];
  });
}

export interface HistogramBin {
  readonly from: number;
  readonly to: number;
  readonly count: number;
}

/** Equal-width bins of trade returns (%), zero kept on a bin edge. */
export function computeReturnHistogram(
  values: readonly number[],
  maxBins = 16
): HistogramBin[] {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return [];
  const min = Math.min(...finite, 0);
  const max = Math.max(...finite, 0);
  const span = max - min || 1;
  const rough = span / Math.max(1, Math.min(maxBins, finite.length));
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const width =
    [1, 2, 2.5, 5, 10]
      .map((step) => step * magnitude)
      .find((step) => step >= rough) ?? rough;
  const start = Math.floor(min / width) * width;
  const count = Math.max(1, Math.ceil((max - start) / width + 1e-9));
  const bins = Array.from({ length: count }, (_, index) => ({
    from: start + index * width,
    to: start + (index + 1) * width,
    count: 0,
  }));
  for (const value of finite) {
    const index = Math.min(count - 1, Math.floor((value - start) / width));
    const bin = bins[index];
    if (bin) bin.count += 1;
  }
  return bins;
}
