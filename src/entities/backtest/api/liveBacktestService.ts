import { apiClient, ApiError, type BacktestJob } from '@/shared/api';
import { connectBacktestStream } from '@/shared/api/websocket';

import {
  type BacktestResult,
  parseEquityPoints,
  parseMetrics,
  parseTrades,
} from '../model/result';
import { BacktestJobError } from '../model/run-error';
import {
  type BacktestRunRequest,
  toBacktestRunPayload,
} from '../model/run-request';
import {
  type BacktestJobSnapshot,
  type BacktestJobStatus,
  type BacktestService,
  type BacktestWatchOptions,
  isTerminalStatus,
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

  public fetchResult(backtestId: string): Promise<BacktestResult> {
    return fetchBacktestArtifacts(backtestId);
  }
}

/** Artifact page size and bound (an hourly year is ~8 800 points). */
const ARTIFACT_PAGE_SIZE = 1_000;
const MAX_ARTIFACT_PAGES = 100;

type ArtifactKind = 'trades' | 'equity-curve';

/** Reads every page of an artifact by following `next_cursor`. */
export async function fetchAllArtifactItems(
  backtestId: string,
  kind: ArtifactKind
): Promise<{ readonly items: unknown[]; readonly truncated: boolean }> {
  const items: unknown[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_ARTIFACT_PAGES; page += 1) {
    const result = await apiClient.getBacktestArtifact<unknown>(
      backtestId,
      kind,
      { limit: ARTIFACT_PAGE_SIZE, ...(cursor ? { cursor } : {}) }
    );
    items.push(...(result.items ?? []));
    cursor = result.next_cursor ?? undefined;
    if (!cursor) return { items, truncated: false };
  }
  return { items, truncated: true };
}

/**
 * Loads a completed backtest: summary metrics, the full equity curve and
 * every trade. Missing values stay null; nothing is invented.
 */
export async function fetchBacktestArtifacts(
  backtestId: string
): Promise<BacktestResult> {
  const [summary, equity, trades] = await Promise.all([
    apiClient.getBacktestSummary(backtestId),
    fetchAllArtifactItems(backtestId, 'equity-curve'),
    fetchAllArtifactItems(backtestId, 'trades'),
  ]);
  return {
    id: backtestId,
    metrics: parseMetrics(summary.metrics),
    equity: parseEquityPoints(equity.items),
    trades: parseTrades(trades.items),
    truncated: equity.truncated || trades.truncated,
  };
}

export const liveBacktestService = new LiveBacktestService();
