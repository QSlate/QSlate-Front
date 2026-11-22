'use client';

import { useQuery } from '@tanstack/react-query';

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
