'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/shared/api';

/** Page size and bound used when reading a run's full log history. */
const LOG_PAGE_SIZE = 500;
const MAX_LOG_PAGES = 10;

export const backtestKeys = {
  all: ['backtests'] as const,
  list: () => [...backtestKeys.all, 'list'] as const,
  logs: (backtestId: string) =>
    [...backtestKeys.all, 'logs', backtestId] as const,
};

/** Reads every log line of a finished run (bounded to 5 000 lines). */
export async function fetchBacktestLogLines(
  backtestId: string
): Promise<readonly string[]> {
  const lines: string[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_LOG_PAGES; page += 1) {
    const result = await apiClient.getBacktestLogs(backtestId, {
      limit: LOG_PAGE_SIZE,
      ...(cursor ? { cursor } : {}),
    });
    for (const item of result.items ?? []) {
      if (typeof item.message === 'string' && item.message.trim() !== '') {
        lines.push(item.message);
      }
    }
    cursor = result.next_cursor ?? undefined;
    if (!cursor) break;
  }
  return lines;
}

/** Whether the user has run at least one backtest (first-run welcome). */
export function useHasBacktests() {
  return useQuery({
    queryKey: [...backtestKeys.list(), 'any'] as const,
    queryFn: async () => {
      const page = await apiClient.getBacktests({ limit: 1 });
      return (page.items ?? []).length > 0;
    },
  });
}

/** Log history of a run over REST (used outside of the live stream). */
export function useBacktestLogs(backtestId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: backtestKeys.logs(backtestId ?? ''),
    queryFn: () => fetchBacktestLogLines(backtestId ?? ''),
    enabled: enabled && backtestId !== null,
    staleTime: Infinity,
  });
}
