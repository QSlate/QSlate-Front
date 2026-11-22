// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api';

import {
  strategyKeys,
  useStrategies,
  useStrategy,
} from '../api/strategy-queries';

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

describe('strategy queries', () => {
  it('builds hierarchical query keys', () => {
    expect(strategyKeys.list()).toEqual(['strategies', 'list']);
    expect(strategyKeys.detail('s1')).toEqual(['strategies', 'detail', 's1']);
  });

  it('lists the owned strategies', async () => {
    vi.spyOn(apiClient, 'getStrategies').mockResolvedValueOnce({
      items: [
        {
          id: 's1',
          version_id: 'v1',
          revision: 3,
          name: 'RSI Trend',
          created_at: '',
          updated_at: '',
        },
      ],
    });

    const { result } = renderHook(() => useStrategies(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.name).toBe('RSI Trend');
  });

  it('does not fetch a detail without a strategy id', () => {
    const spy = vi.spyOn(apiClient, 'getStrategy');
    const { result } = renderHook(() => useStrategy(null), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(spy).not.toHaveBeenCalled();
  });
});
