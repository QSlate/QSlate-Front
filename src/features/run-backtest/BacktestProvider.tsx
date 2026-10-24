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
  INITIAL_MOCK_RESULT,
  mockBacktestService,
  validateBacktest,
} from '@/entities/backtest';

interface BacktestContextValue {
  config: BacktestConfig;
  setConfig: (config: BacktestConfig) => void;
  result: BacktestResult;
  status: 'idle' | 'running' | 'success' | 'error';
  error: string | null;
  run: () => Promise<void>;
}

const BacktestContext = createContext<BacktestContextValue | null>(null);

export function BacktestProvider({
  children,
  service = mockBacktestService,
}: {
  children: ReactNode;
  service?: BacktestService;
}) {
  const [config, updateConfig] = useState(() => ({
    ...DEFAULT_BACKTEST_CONFIG,
  }));
  const [result, setResult] = useState(INITIAL_MOCK_RESULT);
  const [status, setStatus] = useState<BacktestContextValue['status']>('idle');
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

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

  const value = useMemo(
    () => ({ config, setConfig, result, status, error, run }),
    [config, setConfig, result, status, error, run]
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
