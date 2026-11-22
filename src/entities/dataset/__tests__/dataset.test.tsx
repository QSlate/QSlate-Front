// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient, type CustomDataset } from '@/shared/api';

import { useRunnableDatasets } from '../api/dataset-queries';
import { formatCandleCount, isRunnableDataset } from '../model/dataset';

function dataset(overrides: Partial<CustomDataset>): CustomDataset {
  return {
    id: 'ds-1',
    version_id: 'v-1',
    name: 'ETH 4h',
    status: 'ready',
    format: 'csv',
    columns: [],
    row_count: 2190,
    symbol: 'ETHUSDT',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function wrapper({ children }: { readonly children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('dataset model', () => {
  it('only treats ready datasets with a version as runnable', () => {
    expect(isRunnableDataset(dataset({}))).toBe(true);
    for (const status of [
      'uploaded',
      'mapped',
      'validating',
      'failed',
    ] as const)
      expect(isRunnableDataset(dataset({ status }))).toBe(false);
    expect(isRunnableDataset(dataset({ version_id: '' }))).toBe(false);
  });

  it('formats candle counts in French', () => {
    expect(formatCandleCount(2190).replace(/\s/g, ' ')).toBe('2 190 bougies');
    expect(formatCandleCount(1)).toBe('1 bougie');
  });
});

describe('useRunnableDatasets', () => {
  it('lists only ready datasets from the API', async () => {
    vi.spyOn(apiClient, 'getCustomDatasets').mockResolvedValueOnce({
      items: [
        dataset({ id: 'ready' }),
        dataset({ id: 'pending', status: 'mapped' }),
      ],
    });

    const { result } = renderHook(() => useRunnableDatasets(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((item) => item.id)).toEqual(['ready']);
  });
});
