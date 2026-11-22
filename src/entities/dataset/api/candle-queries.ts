'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient, type MarketCandle } from '@/shared/api';

import type { RunDataset } from '../model/run-dataset';
import { datasetKeys } from './dataset-queries';

/** One OHLCV bar; `time` in Unix seconds (UTC). */
export interface Candle {
  readonly time: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

export interface CandleSeries {
  readonly candles: readonly Candle[];
  /** The range held more candles than a chart loads (the first are kept). */
  readonly truncated: boolean;
}

/** Above this the chart would stall; hourly data covers about 2 years. */
export const MAX_CHART_CANDLES = 20_000;
const PAGE_LIMIT = 1_000;
/** History windows are capped at 366 days by Market Data. */
const WINDOW_SECONDS = 366 * 86_400;

function toCandle(item: MarketCandle): Candle | null {
  const time = Date.parse(item.time) / 1_000;
  const values = [item.open, item.high, item.low, item.close, item.volume].map(
    Number
  );
  if (!Number.isFinite(time) || values.some((value) => !Number.isFinite(value)))
    return null;
  const [open = 0, high = 0, low = 0, close = 0, volume = 0] = values;
  return { time, open, high, low, close, volume };
}

/**
 * OHLCV candles of a dataset version between two Unix-second bounds, read
 * in 366-day windows and 1 000-candle pages, sorted and de-duplicated.
 */
export async function fetchDatasetCandles(
  dataset: RunDataset,
  from: number,
  to: number
): Promise<CandleSeries> {
  const resolution = dataset.resolution ?? '1d';
  const byTime = new Map<number, Candle>();
  let truncated = false;
  for (let start = from; start < to && !truncated; start += WINDOW_SECONDS) {
    const end = Math.min(to, start + WINDOW_SECONDS);
    let cursor: string | undefined;
    do {
      const page = await apiClient.getMarketHistory({
        symbol: dataset.symbol,
        resolution,
        start: new Date(start * 1_000).toISOString(),
        end: new Date(end * 1_000).toISOString(),
        limit: PAGE_LIMIT,
        version_id: dataset.versionId,
        ...(cursor ? { cursor } : {}),
      });
      for (const item of page.items ?? []) {
        const candle = toCandle(item);
        if (candle) byTime.set(candle.time, candle);
      }
      cursor = page.next_cursor ?? undefined;
      if (byTime.size >= MAX_CHART_CANDLES) truncated = true;
    } while (cursor && !truncated);
  }
  const candles = [...byTime.values()].sort(
    (left, right) => left.time - right.time
  );
  return { candles: candles.slice(0, MAX_CHART_CANDLES), truncated };
}

/** Candles of a dataset over a run's period (seconds), cached forever. */
export function useDatasetCandles(
  dataset: RunDataset | null,
  range: { readonly from: number; readonly to: number } | null
) {
  return useQuery({
    queryKey: [
      ...datasetKeys.all,
      'candles',
      dataset?.id ?? '',
      dataset?.versionId ?? '',
      range?.from ?? 0,
      range?.to ?? 0,
    ] as const,
    queryFn: () =>
      dataset && range
        ? fetchDatasetCandles(dataset, range.from, range.to)
        : Promise.resolve<CandleSeries>({ candles: [], truncated: false }),
    enabled: dataset !== null && range !== null,
    staleTime: Infinity,
  });
}
