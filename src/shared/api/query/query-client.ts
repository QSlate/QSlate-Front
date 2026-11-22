import { QueryClient } from '@tanstack/react-query';

/** Server data is considered fresh for 30s before a background refetch. */
export const DEFAULT_STALE_TIME_MS = 30_000;

/**
 * Creates the application QueryClient. Heavy lab data (backtests, candles)
 * must not refetch on every window focus, and failed requests are retried
 * once to absorb transient gateway errors without hammering the backend.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
