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
  type BacktestConfig,
  type BacktestResult,
  type BacktestService,
  DEFAULT_BACKTEST_CONFIG,
  fetchBacktestArtifacts,
  INITIAL_MOCK_RESULT,
  liveBacktestService,
  validateBacktest,
} from '@/entities/backtest';
import { useAuthStore } from '@/entities/user/model';
import { useLabStore } from '@/features/lab-state';
import { apiClient } from '@/shared/api';

const LAST_RESULT_STORAGE_KEY = 'qslate_last_backtest_result';

interface BacktestContextValue {
  config: BacktestConfig;
  setConfig: (config: BacktestConfig) => void;
  result: BacktestResult;
  status: 'idle' | 'running' | 'success' | 'error';
  error: string | null;
  run: () => Promise<void>;
  cancel: () => void;
}

const BacktestContext = createContext<BacktestContextValue | null>(null);

export function BacktestProvider({
  children,
  service = liveBacktestService,
}: {
  children: ReactNode;
  service?: BacktestService;
}) {
  const [config, updateConfig] = useState(() => ({
    ...DEFAULT_BACKTEST_CONFIG,
  }));
  const [result, setResult] = useState<BacktestResult>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LAST_RESULT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as BacktestResult;
          if (
            parsed &&
            Array.isArray(parsed.equity) &&
            parsed.equity.length > 0
          ) {
            return parsed;
          }
        }
      } catch {
        // ignore
      }
    }
    return INITIAL_MOCK_RESULT;
  });
  const [status, setStatus] = useState<BacktestContextValue['status']>('idle');
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  const loadedBacktestId = useLabStore((state) => state.loadedBacktestId);
  const token = useAuthStore((state) => state.accessToken);

  // Restore latest completed backtest on load or when loadedBacktestId changes
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const targetId = loadedBacktestId;
      if (targetId) {
        try {
          const loaded = await fetchBacktestArtifacts(targetId, config, token);
          if (!cancelled && loaded) {
            setResult(loaded);
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(
                  LAST_RESULT_STORAGE_KEY,
                  JSON.stringify(loaded)
                );
              } catch {
                // ignore
              }
            }
          }
        } catch {
          // ignore
        }
      } else if (token) {
        try {
          const runs = await apiClient.getBacktests({ limit: 1 }, token);
          const latest = runs.items?.[0];
          if (latest && latest.status === 'completed' && latest.backtest_id) {
            const loaded = await fetchBacktestArtifacts(
              latest.backtest_id,
              config,
              token
            );
            if (!cancelled && loaded) {
              setResult(loaded);
              if (typeof window !== 'undefined') {
                try {
                  localStorage.setItem(
                    LAST_RESULT_STORAGE_KEY,
                    JSON.stringify(loaded)
                  );
                } catch {
                  // ignore
                }
              }
            }
          }
        } catch {
          // ignore
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadedBacktestId, token, config]);

  const setConfig = useCallback((next: BacktestConfig) => {
    updateConfig({ ...next });
    if (!controller.current) {
      setError(null);
      setStatus((current) => (current === 'error' ? 'idle' : current));
    }
  }, []);

  const run = useCallback(async () => {
    if (controller.current) return;
    const validation = validateBacktest(config);
    if (validation) {
      setError(validation);
      setStatus('error');
      return;
    }
    const request = new AbortController();
    controller.current = request;
    setError(null);
    setStatus('running');
    try {
      const next = await service.run({ ...config }, request.signal);
      if (!request.signal.aborted) {
        setResult(next);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(LAST_RESULT_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
        }
        setStatus('success');
      }
    } catch (cause) {
      if (!request.signal.aborted) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Unable to run this backtest. Please try again.'
        );
        setStatus('error');
      }
    } finally {
      if (controller.current === request) controller.current = null;
    }
  }, [config, service]);

  const cancel = useCallback(() => {
    if (controller.current) {
      controller.current.abort();
      controller.current = null;
      setStatus('idle');
    }
  }, []);

  const value = useMemo(
    () => ({ config, setConfig, result, status, error, run, cancel }),
    [config, setConfig, result, status, error, run, cancel]
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
