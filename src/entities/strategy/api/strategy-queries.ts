'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { apiClient, type Strategy, type StrategySummary } from '@/shared/api';

/** Upper bound of strategies listed in pickers (backend max is 1000). */
const STRATEGY_LIST_LIMIT = 200;

export const strategyKeys = {
  all: ['strategies'] as const,
  list: () => [...strategyKeys.all, 'list'] as const,
  detail: (id: string) => [...strategyKeys.all, 'detail', id] as const,
};

/** Strategies owned by the current user, latest version of each. */
export function useStrategies() {
  return useQuery({
    queryKey: strategyKeys.list(),
    queryFn: async (): Promise<readonly StrategySummary[]> => {
      const page = await apiClient.getStrategies({
        limit: STRATEGY_LIST_LIMIT,
      });
      return page.items ?? [];
    },
  });
}

/** Strategy detail (source and default parameters of the current version). */
export function useStrategy(strategyId: string | null) {
  return useQuery({
    queryKey: strategyKeys.detail(strategyId ?? ''),
    queryFn: (): Promise<Strategy> => apiClient.getStrategy(strategyId ?? ''),
    enabled: strategyId !== null,
  });
}

/**
 * Marks every strategy query stale (list and details). Call it after any
 * create, update, restore, import or install so pickers use the latest
 * version_id and default parameters.
 */
export function useInvalidateStrategies(): () => Promise<void> {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: strategyKeys.all }),
    [queryClient]
  );
}
