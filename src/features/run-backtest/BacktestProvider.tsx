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
  type BacktestResult,
  type BacktestRunError,
  type BacktestRunRequest,
  type BacktestService,
  describeRunError,
  EMPTY_BACKTEST_RESULT,
  fetchBacktestArtifacts,
  liveBacktestService,
} from '@/entities/backtest';
import { useAuthStore } from '@/entities/user/model';
import { useLabStore } from '@/features/lab-state';
import { apiClient } from '@/shared/api';

const LAST_RESULT_STORAGE_KEY = 'qslate_last_backtest_result';

export type BacktestStatus = 'idle' | 'running' | 'success' | 'error';

interface BacktestContextValue {
  result: BacktestResult;
  status: BacktestStatus;
  error: BacktestRunError | null;
  /** Starts a run with exactly this request (ignored while one is running). */
  run: (request: BacktestRunRequest) => Promise<void>;
  /** Runs the last submitted request again. */
  retry: () => Promise<void>;
  /** Stops the current run and asks the server to cancel it. */
  cancel: () => void;
  /** Whether a previous request exists for `retry`. */
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

export function BacktestProvider({
  children,
  service = liveBacktestService,
}: {
  children: ReactNode;
  service?: BacktestService;
}) {
  const [result, setResult] = useState<BacktestResult>(readPersistedResult);
  const [status, setStatus] = useState<BacktestStatus>('idle');
  const [error, setError] = useState<BacktestRunError | null>(null);
  const [lastRequest, setLastRequest] = useState<BacktestRunRequest | null>(
    null
  );
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  const loadedBacktestId = useLabStore((state) => state.loadedBacktestId);
  const setLoadedBacktestId = useLabStore((state) => state.setLoadedBacktestId);
  const token = useAuthStore((state) => state.accessToken);

  // Restore the selected (or latest completed) backtest on load.
  useEffect(() => {
    let cancelled = false;

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
        if (!targetId) return;
        const loaded = await fetchBacktestArtifacts(targetId, null, token);
        if (!cancelled) {
          setResult(loaded);
          persistResult(loaded);
        }
      } catch {
        // Restoring is best effort: keep the current result.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadedBacktestId, token]);

  const run = useCallback(
    async (request: BacktestRunRequest) => {
      if (controller.current) return;
      const job = new AbortController();
      controller.current = job;
      setLastRequest(request);
      setError(null);
      setStatus('running');
      try {
        const next = await service.run(request, {
          signal: job.signal,
          onAccepted: setLoadedBacktestId,
        });
        if (!job.signal.aborted) {
          setResult(next);
          persistResult(next);
          setStatus('success');
        }
      } catch (cause) {
        if (!job.signal.aborted) {
          const described = describeRunError(cause);
          if (described.action === 'reconnect') {
            useAuthStore.getState().clearAuth();
          }
          setError(described);
          setStatus('error');
        }
      } finally {
        if (controller.current === job) controller.current = null;
      }
    },
    [service, setLoadedBacktestId]
  );

  const retry = useCallback(async () => {
    if (lastRequest) await run(lastRequest);
  }, [lastRequest, run]);

  const cancel = useCallback(() => {
    if (controller.current) {
      controller.current.abort();
      controller.current = null;
      setStatus('idle');
    }
  }, []);

  const value = useMemo(
    () => ({
      result,
      status,
      error,
      run,
      retry,
      cancel,
      canRetry: lastRequest !== null,
    }),
    [result, status, error, run, retry, cancel, lastRequest]
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
