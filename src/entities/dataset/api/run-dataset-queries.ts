'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient, type MarketSymbol } from '@/shared/api';

import { type RunDataset, toRunDatasets } from '../model/run-dataset';
import { datasetKeys } from './dataset-queries';

const SYMBOL_PAGE_LIMIT = 200;
const MAX_SYMBOL_PAGES = 5;
const DAY_MS = 86_400_000;
/** History windows are capped at 366 days by Market Data. */
const PROBE_WINDOW_DAYS = 366;
const MAX_PROBES = 6;

async function fetchRunDatasets(): Promise<readonly RunDataset[]> {
  const symbols: MarketSymbol[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_SYMBOL_PAGES; page += 1) {
    const result = await apiClient.getMarketSymbols({
      limit: SYMBOL_PAGE_LIMIT,
      ...(cursor ? { cursor } : {}),
    });
    symbols.push(...(result.items ?? []));
    cursor = result.next_cursor ?? undefined;
    if (!cursor) break;
  }
  return toRunDatasets(symbols);
}

/** Public catalogue plus the user's ready datasets, runnable as-is. */
export function useRunDatasets() {
  return useQuery({
    queryKey: [...datasetKeys.all, 'runnable'] as const,
    queryFn: fetchRunDatasets,
  });
}

/** Pages read inside one window (an hourly year is about 9 pages). */
const MAX_PAGES_PER_WINDOW = 12;

/**
 * Time of the last candle of a dataset version, found by reading 366-day
 * windows backwards from today at the dataset's own resolution (public
 * symbols only serve their resolution). Null when no candle was found.
 */
export async function fetchDatasetCoverageEnd(
  dataset: RunDataset,
  now: number = Date.now()
): Promise<string | null> {
  const resolution = dataset.resolution ?? '1d';
  let end = Math.ceil(now / DAY_MS) * DAY_MS;
  for (let probe = 0; probe < MAX_PROBES; probe += 1) {
    const start = end - PROBE_WINDOW_DAYS * DAY_MS;
    let cursor: string | undefined;
    let last: string | null = null;
    for (let page = 0; page < MAX_PAGES_PER_WINDOW; page += 1) {
      const result = await apiClient.getMarketHistory({
        symbol: dataset.symbol,
        resolution,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        limit: 1_000,
        version_id: dataset.versionId,
        ...(cursor ? { cursor } : {}),
      });
      last = result.items?.[result.items.length - 1]?.time ?? last;
      cursor = result.next_cursor ?? undefined;
      if (!cursor) break;
    }
    if (last) return last;
    end = start;
  }
  return null;
}

/** Last candle of the selected dataset (anchors relative periods). */
export function useDatasetCoverageEnd(dataset: RunDataset | null) {
  return useQuery({
    queryKey: [
      ...datasetKeys.all,
      'coverage-end',
      dataset?.id ?? '',
      dataset?.versionId ?? '',
    ] as const,
    queryFn: () =>
      dataset ? fetchDatasetCoverageEnd(dataset) : Promise.resolve(null),
    enabled: dataset !== null,
    staleTime: Infinity,
  });
}
