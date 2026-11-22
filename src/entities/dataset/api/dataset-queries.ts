'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { apiClient, type CustomDataset } from '@/shared/api';

import { isRunnableDataset } from '../model/dataset';

const DATASET_LIST_LIMIT = 200;

export const datasetKeys = {
  all: ['datasets'] as const,
  list: () => [...datasetKeys.all, 'list'] as const,
};

async function fetchDatasets(): Promise<readonly CustomDataset[]> {
  const page = await apiClient.getCustomDatasets({ limit: DATASET_LIST_LIMIT });
  return page.items ?? [];
}

function selectRunnable(
  items: readonly CustomDataset[]
): readonly CustomDataset[] {
  return items.filter(isRunnableDataset);
}

/** Custom datasets owned by the current user (every status). */
export function useDatasets() {
  return useQuery({ queryKey: datasetKeys.list(), queryFn: fetchDatasets });
}

/** Datasets that can be used by a backtest run right now (status ready). */
export function useRunnableDatasets() {
  return useQuery({
    queryKey: datasetKeys.list(),
    queryFn: fetchDatasets,
    select: selectRunnable,
  });
}

/**
 * Marks dataset queries stale. Call it after upload, column mapping,
 * validation or deletion so the run composer sees the current versions.
 */
export function useInvalidateDatasets(): () => Promise<void> {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: datasetKeys.all }),
    [queryClient]
  );
}
