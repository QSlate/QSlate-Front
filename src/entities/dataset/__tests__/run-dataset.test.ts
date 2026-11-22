import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api';

import { fetchDatasetCoverageEnd } from '../api/run-dataset-queries';
import { formatDatasetLabel, toRunDatasets } from '../model/run-dataset';

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('toRunDatasets', () => {
  it('keeps dataset-backed symbols, public catalogue first', () => {
    const datasets = toRunDatasets([
      {
        symbol: 'custom:abc',
        name: 'Mon CSV',
        dataset_id: 'abc',
        version_id: 'v1',
        live: false,
      },
      {
        symbol: 'ETH/USDT@1h',
        name: 'Ether',
        dataset_id: 'public-eth-usdt-1h',
        version_id: 'p1',
        resolution: '1h',
        live: false,
      },
      { symbol: 'LIVE', name: 'Live feed', live: true },
    ]);
    expect(datasets.map((item) => [item.id, item.source])).toEqual([
      ['public-eth-usdt-1h', 'public'],
      ['abc', 'custom'],
    ]);
    expect(formatDatasetLabel(datasets[0]!)).toBe('ETH / USDT · 1 h');
    expect(formatDatasetLabel(datasets[1]!)).toBe('Mon CSV');
  });
});

describe('fetchDatasetCoverageEnd', () => {
  it('walks 366-day windows back until it finds the last candle', async () => {
    const history = vi
      .spyOn(apiClient, 'getMarketHistory')
      .mockResolvedValueOnce({ symbol: 's', resolution: '1d', items: [] })
      .mockResolvedValueOnce({
        symbol: 's',
        resolution: '1d',
        items: [
          {
            time: '2025-03-17T00:00:00Z',
            open: '1',
            high: '1',
            low: '1',
            close: '1',
            volume: '1',
          },
          {
            time: '2025-03-18T00:00:00Z',
            open: '1',
            high: '1',
            low: '1',
            close: '1',
            volume: '1',
          },
        ],
      });
    const end = await fetchDatasetCoverageEnd(
      {
        id: 'd',
        versionId: 'v',
        name: 'n',
        symbol: 'ETH/USDT@1d',
        resolution: '1d',
        source: 'public',
      },
      Date.parse('2026-01-01T00:00:00Z')
    );
    expect(end).toBe('2025-03-18T00:00:00Z');
    expect(history).toHaveBeenCalledTimes(2);
    expect(history.mock.calls[1]?.[0]).toMatchObject({
      version_id: 'v',
      resolution: '1d',
    });
  });
});
