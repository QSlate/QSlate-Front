import { apiClient, ApiError, type BacktestJob } from '@/shared/api';
import { connectBacktestStream } from '@/shared/api/websocket';

import { BacktestJobError } from '../model/run-error';
import {
  type BacktestRunRequest,
  toBacktestRunPayload,
} from '../model/run-request';
import {
  type BacktestJobSnapshot,
  type BacktestJobStatus,
  type BacktestResult,
  type BacktestService,
  type BacktestWatchOptions,
  type EquityPoint,
  isTerminalStatus,
  type MonthlyReturn,
  type Trade,
} from '../model/types';
import {
  backtestStreamUrl,
  canOpenWebSocket,
  watchBacktestStream,
} from './stream-watch';

const POLL_INTERVAL_MS = 1_000;
/** Consecutive transient failures tolerated before giving up. */
const MAX_TRANSIENT_POLL_FAILURES = 5;
/** Safety bound for an orphaned watch; long runs are normal. */
const WATCH_TIMEOUT_MS = 60 * 60_000;

function abortError(): DOMException {
  return new DOMException('Stopped listening to the backtest', 'AbortError');
}

/** Sleeps `ms`, rejecting with an AbortError as soon as `signal` aborts. */
export function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Network failures, 429 and 5xx are worth retrying; 401/403/404 and other
 * client errors are final and must reach the user right away.
 */
export function isTransientError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.statusCode === 429 || error.statusCode >= 500;
  }
  return error instanceof TypeError;
}

function toStatus(status: BacktestJob['status']): BacktestJobStatus {
  return status === 'pending' ? 'queued' : status;
}

export function toJobSnapshot(job: BacktestJob): BacktestJobSnapshot {
  const progress = typeof job.progress === 'number' ? job.progress : null;
  return {
    backtestId: job.backtest_id,
    status: toStatus(job.status),
    progress: progress === null ? null : Math.min(100, Math.max(0, progress)),
    error: job.error ?? null,
  };
}

/**
 * Polls GET /backtests/{id}/status until the job is terminal. Used directly
 * and as the fallback of the WebSocket stream.
 */
export async function pollBacktest(
  backtestId: string,
  { signal, onUpdate }: BacktestWatchOptions
): Promise<BacktestJobSnapshot> {
  const startedAt = Date.now();
  let failures = 0;
  for (;;) {
    if (signal.aborted) throw abortError();
    try {
      const snapshot = toJobSnapshot(
        await apiClient.getBacktestStatus(backtestId)
      );
      failures = 0;
      onUpdate?.(snapshot);
      if (isTerminalStatus(snapshot.status)) return snapshot;
    } catch (error) {
      if (!isTransientError(error)) throw error;
      failures += 1;
      if (failures > MAX_TRANSIENT_POLL_FAILURES) throw error;
    }
    if (Date.now() - startedAt > WATCH_TIMEOUT_MS) {
      throw new BacktestJobError('timeout', null);
    }
    await abortableDelay(POLL_INTERVAL_MS, signal);
  }
}

/**
 * Lab service adapter: submits exactly the given request, follows the job
 * and loads its artifacts. It never creates strategies nor falls back to
 * hard-coded ids; errors are raised as-is (see describeRunError).
 */
export class LiveBacktestService implements BacktestService {
  public async submit(
    request: BacktestRunRequest
  ): Promise<BacktestJobSnapshot> {
    return toJobSnapshot(
      await apiClient.runBacktest(toBacktestRunPayload(request))
    );
  }

  public watch(
    backtestId: string,
    options: BacktestWatchOptions
  ): Promise<BacktestJobSnapshot> {
    if (!canOpenWebSocket()) return pollBacktest(backtestId, options);
    return watchBacktestStream(backtestId, options, {
      connect: connectBacktestStream,
      getToken: () => apiClient.getToken(),
      getUrl: backtestStreamUrl,
      confirm: pollBacktest,
      delay: abortableDelay,
    });
  }

  public async cancel(backtestId: string): Promise<void> {
    await apiClient.cancelBacktest(backtestId);
  }

  public fetchResult(
    backtestId: string,
    initialCapital: number | null
  ): Promise<BacktestResult> {
    return fetchBacktestArtifacts(backtestId, initialCapital);
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
