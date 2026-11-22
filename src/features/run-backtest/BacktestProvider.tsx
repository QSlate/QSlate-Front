'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  BacktestJobError,
  type BacktestJobSnapshot,
  type BacktestResult,
  type BacktestRunError,
  type BacktestRunRequest,
  type BacktestService,
  describeRunError,
  EMPTY_BACKTEST_RESULT,
  liveBacktestService,
  MAX_RUN_LOG_LINES,
} from '@/entities/backtest';
import { useAuthStore } from '@/entities/user/model';
import { useLabStore } from '@/features/lab-state';
import { apiClient } from '@/shared/api';

import {
  clearActiveRun,
  persistActiveRun,
  type PersistedActiveRun,
  readActiveRun,
} from './model/active-run-storage';

const LAST_RESULT_STORAGE_KEY = 'qslate_last_backtest_result';

export type BacktestStatus =
  'idle' | 'running' | 'cancelling' | 'success' | 'error';

/** The run currently followed by this browser tab. */
export interface ActiveRun {
  /** Null until the lab service accepted the job. */
  readonly backtestId: string | null;
  readonly request: BacktestRunRequest | null;
  readonly startedAt: number;
  readonly job: BacktestJobSnapshot | null;
}

/** The last run that finished in this session (for the summary line). */
export interface FinishedRun {
  readonly backtestId: string;
  readonly request: BacktestRunRequest | null;
  readonly startedAt: number;
  readonly finishedAt: number;
}

interface BacktestContextValue {
  result: BacktestResult;
  status: BacktestStatus;
  error: BacktestRunError | null;
  activeRun: ActiveRun | null;
  lastRun: FinishedRun | null;
  /** Log lines streamed for the active (or just finished) run. */
  runLogs: readonly string[];
  /** Starts a run; ignored until the previous one has fully settled. */
  run: (request: BacktestRunRequest) => Promise<void>;
  /** Runs the last submitted request again. */
  retry: () => Promise<void>;
  /** Asks the server to cancel the active run (even before its id is known). */
  cancel: () => void;
  canRetry: boolean;
}

const BacktestContext = createContext<BacktestContextValue | null>(null);

function persistResult(result: BacktestResult) {
  try {
    localStorage.setItem(LAST_RESULT_STORAGE_KEY, JSON.stringify(result));
  } catch {
    // Storage may be full or unavailable (private mode): keep it in memory.
  }
}

function readPersistedResult(): BacktestResult {
  if (typeof window === 'undefined') return EMPTY_BACKTEST_RESULT;
  try {
    const saved = localStorage.getItem(LAST_RESULT_STORAGE_KEY);
    if (!saved) return EMPTY_BACKTEST_RESULT;
    const parsed = JSON.parse(saved) as BacktestResult;
    if (
      parsed &&
      parsed.source === 'backend' &&
      parsed.id &&
      Array.isArray(parsed.equity) &&
      parsed.equity.length > 0
    ) {
      return {
        ...parsed,
        initialCapital:
          typeof parsed.initialCapital === 'number'
            ? parsed.initialCapital
            : null,
      };
    }
    localStorage.removeItem(LAST_RESULT_STORAGE_KEY);
  } catch {
    // Corrupted entry: start from an empty result.
  }
  return EMPTY_BACKTEST_RESULT;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

const CANCEL_FAILED_PREFIX = "Impossible d'arrêter le backtest";

export function BacktestProvider({
  children,
  service = liveBacktestService,
}: {
  children: ReactNode;
  service?: BacktestService;
}) {
  const [result, setResult] = useState<BacktestResult>(readPersistedResult);
  const [status, setStatusState] = useState<BacktestStatus>('idle');
  const [error, setError] = useState<BacktestRunError | null>(null);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [lastRun, setLastRun] = useState<FinishedRun | null>(null);
  const [runLogs, setRunLogs] = useState<readonly string[]>([]);
  const [lastRequest, setLastRequest] = useState<BacktestRunRequest | null>(
    null
  );

  /** Identifies the run this provider instance currently follows. */
  const runTokenRef = useRef(0);
  const statusRef = useRef<BacktestStatus>('idle');
  const listenRef = useRef<AbortController | null>(null);
  const cancelRequestedRef = useRef(false);
  const activeIdRef = useRef<string | null>(null);
  /** Bumped on every committed result; stale restores are discarded. */
  const resultVersionRef = useRef(0);
  const resultIdRef = useRef<string>(result.id);

  const loadedBacktestId = useLabStore((state) => state.loadedBacktestId);
  const setLoadedBacktestId = useLabStore((state) => state.setLoadedBacktestId);
  const token = useAuthStore((state) => state.accessToken);

  const setStatus = useCallback((next: BacktestStatus) => {
    statusRef.current = next;
    setStatusState(next);
  }, []);

  const commitResult = useCallback((next: BacktestResult) => {
    resultVersionRef.current += 1;
    resultIdRef.current = next.id;
    setResult(next);
    persistResult(next);
  }, []);

  const fail = useCallback(
    (cause: unknown) => {
      const described = describeRunError(cause);
      if (described.action === 'reconnect') {
        useAuthStore.getState().clearAuth();
      }
      setError(described);
      setStatus('error');
    },
    [setStatus]
  );

  const endRun = useCallback(() => {
    listenRef.current?.abort();
    listenRef.current = null;
    activeIdRef.current = null;
    cancelRequestedRef.current = false;
    clearActiveRun();
    setActiveRun(null);
  }, []);

  /** Follows an accepted job until it is terminal, then loads its result. */
  const follow = useCallback(
    async (runToken: number, run: PersistedActiveRun) => {
      const listen = new AbortController();
      listenRef.current = listen;
      activeIdRef.current = run.backtestId;
      try {
        const final = await service.watch(run.backtestId, {
          signal: listen.signal,
          onUpdate: (job) => {
            if (runToken !== runTokenRef.current) return;
            setActiveRun((current) =>
              current && current.backtestId === job.backtestId
                ? { ...current, job }
                : current
            );
          },
          onLogs: (lines) => {
            if (runToken !== runTokenRef.current) return;
            setRunLogs((current) =>
              [...current, ...lines].slice(-MAX_RUN_LOG_LINES)
            );
          },
        });
        if (runToken !== runTokenRef.current) return;
        if (final.status === 'cancelled' && cancelRequestedRef.current) {
          // The user's own cancel reached the server first.
          runTokenRef.current += 1;
          endRun();
          setStatus('idle');
          return;
        }
        if (final.status !== 'completed') {
          throw new BacktestJobError(
            final.status === 'cancelled' ? 'cancelled' : 'failed',
            final.error
          );
        }
        const next = await service.fetchResult(
          run.backtestId,
          run.request?.initialCapital ?? null
        );
        if (runToken !== runTokenRef.current) return;
        commitResult(next);
        // Only a completed run becomes the "loaded" backtest (logs, restore).
        setLoadedBacktestId(run.backtestId);
        setLastRun({
          backtestId: run.backtestId,
          request: run.request,
          startedAt: run.startedAt,
          finishedAt: Date.now(),
        });
        setStatus('success');
        endRun();
      } catch (cause) {
        // Detached (unmount) or superseded by a cancel: nothing to report.
        if (isAbortError(cause) || runToken !== runTokenRef.current) return;
        fail(cause);
        endRun();
      }
    },
    [commitResult, endRun, fail, service, setLoadedBacktestId, setStatus]
  );

  const performCancel = useCallback(
    async (runToken: number, backtestId: string) => {
      try {
        await service.cancel(backtestId);
        if (runToken !== runTokenRef.current) return;
        runTokenRef.current += 1;
        endRun();
        setStatus('idle');
      } catch (cause) {
        if (runToken !== runTokenRef.current) return;
        cancelRequestedRef.current = false;
        const described = describeRunError(cause);
        setError({
          code: 'cancel_failed',
          action: 'none',
          message: `${CANCEL_FAILED_PREFIX} : ${described.message}`,
        });
        // The job keeps running on the server: keep following it.
        setStatus('running');
      }
    },
    [endRun, service, setStatus]
  );

  const run = useCallback(
    async (request: BacktestRunRequest) => {
      if (statusRef.current === 'running' || statusRef.current === 'cancelling')
        return;
      runTokenRef.current += 1;
      const runToken = runTokenRef.current;
      const startedAt = Date.now();
      cancelRequestedRef.current = false;
      setLastRequest(request);
      setError(null);
      setRunLogs([]);
      setStatus('running');
      setActiveRun({ backtestId: null, request, startedAt, job: null });

      let job: BacktestJobSnapshot;
      try {
        job = await service.submit(request);
      } catch (cause) {
        if (runToken !== runTokenRef.current) return;
        fail(cause);
        endRun();
        return;
      }
      const accepted: PersistedActiveRun = {
        backtestId: job.backtestId,
        request,
        startedAt,
      };
      // Persist even if detached meanwhile, so a remount can re-attach.
      persistActiveRun(accepted);
      if (runToken !== runTokenRef.current) return;
      activeIdRef.current = job.backtestId;
      setActiveRun({ backtestId: job.backtestId, request, startedAt, job });
      if (cancelRequestedRef.current) {
        await performCancel(runToken, job.backtestId);
        return;
      }
      await follow(runToken, accepted);
    },
    [endRun, fail, follow, performCancel, service, setStatus]
  );

  const retry = useCallback(async () => {
    if (lastRequest) await run(lastRequest);
  }, [lastRequest, run]);

  const cancel = useCallback(() => {
    if (statusRef.current !== 'running') return;
    setStatus('cancelling');
    cancelRequestedRef.current = true;
    const backtestId = activeIdRef.current;
    // Without an id yet, run() cancels as soon as the job is accepted.
    if (backtestId) void performCancel(runTokenRef.current, backtestId);
  }, [performCancel, setStatus]);

  // Re-attach to a run started before a reload or navigation; detach (never
  // cancel) when this provider unmounts.
  useEffect(() => {
    const persisted = readActiveRun();
    if (persisted) {
      runTokenRef.current += 1;
      const runToken = runTokenRef.current;
      setLastRequest(persisted.request);
      setStatus('running');
      setActiveRun({ ...persisted, job: null });
      void follow(runToken, persisted);
    }
    return () => {
      runTokenRef.current += 1;
      listenRef.current?.abort();
      listenRef.current = null;
    };
  }, [follow, setStatus]);

  // Restore the selected (or latest completed) backtest. Never applies to
  // the active run, and never overwrites a result committed meanwhile.
  useEffect(() => {
    let cancelled = false;
    const version = resultVersionRef.current;

    void (async () => {
      try {
        let targetId = loadedBacktestId;
        if (!targetId && token) {
          const runs = await apiClient.getBacktests({ limit: 1 }, token);
          const latest = runs.items?.[0];
          if (latest && latest.status === 'completed') {
            targetId = latest.backtest_id;
          }
        }
        if (
          !targetId ||
          targetId === activeIdRef.current ||
          targetId === resultIdRef.current
        )
          return;
        const loaded = await service.fetchResult(targetId, null);
        if (!cancelled && version === resultVersionRef.current) {
          commitResult(loaded);
        }
      } catch {
        // Restoring is best effort: keep the current result.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [commitResult, loadedBacktestId, service, token]);

  const value = useMemo(
    () => ({
      result,
      status,
      error,
      activeRun,
      lastRun,
      runLogs,
      run,
      retry,
      cancel,
      canRetry: lastRequest !== null,
    }),
    [
      result,
      status,
      error,
      activeRun,
      lastRun,
      runLogs,
      run,
      retry,
      cancel,
      lastRequest,
    ]
  );

  return (
    <BacktestContext.Provider value={value}>
      {children}
    </BacktestContext.Provider>
  );
}

export function useBacktest() {
  const context = useContext(BacktestContext);
  if (!context) throw new Error('useBacktest requires BacktestProvider');
  return context;
}
