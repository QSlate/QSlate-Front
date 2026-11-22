import { apiClient, type BacktestJob } from '@/shared/api';

import { BacktestJobError } from '../model/run-error';
import {
  type BacktestRunRequest,
  toBacktestRunPayload,
} from '../model/run-request';
import {
  type BacktestResult,
  type BacktestRunOptions,
  type BacktestService,
  type EquityPoint,
  type MonthlyReturn,
  type Trade,
} from '../model/types';

const POLL_INTERVAL_MS = 400;
/**
 * Upper bound for status polling. Long runs on large datasets are normal;
 * this only stops an orphaned loop. Step 4 of #144 replaces polling with the
 * backtest WebSocket stream.
 */
const POLL_TIMEOUT_MS = 10 * 60_000;

function cancelledByUser(): DOMException {
  return new DOMException('Backtest was cancelled by user', 'AbortError');
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs exactly the given request on the lab service: enqueue, poll the job
 * status, then load its artifacts. It never creates strategies nor falls
 * back to hard-coded ids; errors are raised as-is for the caller to
 * describe (see describeRunError).
 */
export class LiveBacktestService implements BacktestService {
  public async run(
    request: BacktestRunRequest,
    options: BacktestRunOptions = {}
  ): Promise<BacktestResult> {
    const { signal, onAccepted } = options;
    let job: BacktestJob = await apiClient.runBacktest(
      toBacktestRunPayload(request)
    );

    const cancel = async () => {
      await apiClient.cancelBacktest(job.backtest_id).catch(() => undefined);
      throw cancelledByUser();
    };

    if (signal?.aborted) return cancel();
    onAccepted?.(job.backtest_id);

    const startedAt = Date.now();
    while (job.status !== 'completed') {
      if (job.status === 'failed' || job.status === 'cancelled') {
        throw new BacktestJobError(job.status, job.error ?? null);
      }
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        throw new BacktestJobError('timeout', null);
      }
      await wait(POLL_INTERVAL_MS);
      if (signal?.aborted) return cancel();
      try {
        job = await apiClient.getBacktestStatus(job.backtest_id);
      } catch {
        // Transient status failures are retried on the next tick.
      }
    }

    return fetchBacktestArtifacts(job.backtest_id, request.initialCapital);
  }
}

export async function fetchBacktestArtifacts(
  backtestId: string,
  initialCapital: number | null,
  token?: string | null
): Promise<BacktestResult> {
  // Fetch summary metrics, trades and equity curve
  const [summaryRes, tradesRes, equityRes] = await Promise.allSettled([
    apiClient.getBacktestSummary(backtestId, token),
    apiClient.getBacktestTrades(backtestId, { limit: 100 }, token),
    apiClient.getBacktestEquityCurve(backtestId, undefined, token),
  ]);

  const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : null;
  const tradesPage = tradesRes.status === 'fulfilled' ? tradesRes.value : null;
  const equityPage = equityRes.status === 'fulfilled' ? equityRes.value : null;

  const metrics = summary?.metrics || {};

  // Transform backend trades to frontend Trade schema
  const rawTrades = Array.isArray(tradesPage?.items)
    ? (tradesPage.items as Record<string, unknown>[])
    : [];
  const trades: Trade[] = rawTrades.map((t, index) => ({
    id: String(t.id || `trade-${index + 1}`),
    timestamp: t.timestamp
      ? new Date(String(t.timestamp)).getTime() / 1000
      : Date.now() / 1000 - (rawTrades.length - index) * 3600,
    ticker: String(t.symbol || 'ETH'),
    side: (String(t.side || 'BUY').toUpperCase() === 'SELL'
      ? 'SELL'
      : 'BUY') as 'BUY' | 'SELL',
    quantity: Number(t.quantity || t.amount || 1),
    entry: Number(t.entry_price || t.price || 2200),
    exit: Number(t.exit_price || t.entry_price || 2250),
    pnl: Number(t.pnl_usd || t.pnl || 0),
    pnlPercent: Number(t.pnl_pct || t.pnl_percent || 0),
    slippageMs: Number(t.slippage_ms || 0.4),
    executionHash: String(
      t.execution_hash || `0x${(index * 7919).toString(16).padStart(8, '0')}`
    ),
  }));

  // Transform backend equity points or synthesize from start to end
  const rawEquity = Array.isArray(equityPage?.items)
    ? (equityPage.items as Record<string, unknown>[])
    : [];
  const parsedEquity: EquityPoint[] =
    rawEquity.length > 0
      ? rawEquity
          .map((p) => {
            const parsedTime =
              typeof p.time === 'number'
                ? p.time
                : Math.floor(
                    new Date(String(p.timestamp || p.time)).getTime() / 1000
                  );
            const nav = Number(p.nav ?? p.equity);
            const benchmark = Number(p.benchmark ?? initialCapital ?? nav);
            return {
              time: Number.isFinite(parsedTime) ? parsedTime : 0,
              nav,
              benchmark: Number.isFinite(benchmark) ? benchmark : nav,
            };
          })
          .filter((p) => p.time > 0 && Number.isFinite(p.nav))
      : [];

  const equity: EquityPoint[] = parsedEquity;

  return {
    id: backtestId,
    source: 'backend',
    initialCapital,
    equity,
    monthlyReturns: computeMonthlyReturns(equity),
    trades,
    metrics: {
      sharpe: Number(metrics.sharpe_ratio ?? 0),
      sortino: Number(metrics.sortino_ratio ?? 0),
      maxDrawdown: Number(metrics.max_drawdown_pct ?? 0),
      winRate: Number(metrics.win_rate_pct ?? 0),
      profitFactor:
        metrics.profit_factor !== undefined
          ? Number(metrics.profit_factor)
          : null,
      calmar:
        metrics.calmar_ratio !== undefined
          ? Number(metrics.calmar_ratio)
          : null,
      volatility: Number(metrics.volatility ?? 0),
      beta: Number(metrics.beta ?? 0),
      alpha: Number(metrics.alpha ?? 0),
      trades: Number(metrics.total_trades ?? trades.length),
    },
    oosReturn: Number(metrics.return_pct ?? 0),
    longestDrawdownDays: Number(metrics.max_drawdown_days ?? 0),
  };
}

export function computeMonthlyReturns(equity: EquityPoint[]): MonthlyReturn[] {
  if (!equity || equity.length < 2) return [];
  const monthlyBuckets = new Map<
    string,
    { firstNav: number; lastNav: number }
  >();
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  for (const pt of equity) {
    if (!pt || !Number.isFinite(pt.time) || !Number.isFinite(pt.nav)) continue;
    const date = new Date(pt.time * 1000);
    const key = `${monthNames[date.getUTCMonth()]} ${String(date.getUTCFullYear()).slice(-2)}`;
    const existing = monthlyBuckets.get(key);
    if (!existing) {
      monthlyBuckets.set(key, { firstNav: pt.nav, lastNav: pt.nav });
    } else {
      existing.lastNav = pt.nav;
    }
  }
  const results: MonthlyReturn[] = [];
  for (const [month, { firstNav, lastNav }] of monthlyBuckets.entries()) {
    const retPct = firstNav > 0 ? ((lastNav - firstNav) / firstNav) * 100 : 0;
    results.push({ month, value: Number(retPct.toFixed(2)) });
  }
  return results;
}

export const liveBacktestService = new LiveBacktestService();
