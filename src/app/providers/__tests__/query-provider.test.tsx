// @vitest-environment jsdom
import { useQueryClient } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_STALE_TIME_MS } from '@/shared/api';

import { QueryProvider } from '../query-provider';

function DefaultsProbe() {
  const queries = useQueryClient().getDefaultOptions().queries;
  return (
    <span>{`${String(queries?.staleTime)}|${String(queries?.retry)}|${String(
      queries?.refetchOnWindowFocus
    )}`}</span>
  );
}

afterEach(() => {
  cleanup();
});

describe('QueryProvider', () => {
  it('exposes a QueryClient with the application defaults', () => {
    render(
      <QueryProvider>
        <DefaultsProbe />
      </QueryProvider>
    );

    expect(screen.getByText(`${DEFAULT_STALE_TIME_MS}|1|false`)).toBeDefined();
  });

  it('keeps the same client across re-renders', () => {
    const clients: unknown[] = [];
    function Capture() {
      clients.push(useQueryClient());
      return null;
    }
    const { rerender } = render(
      <QueryProvider>
        <Capture />
      </QueryProvider>
    );
    rerender(
      <QueryProvider>
        <Capture />
      </QueryProvider>
    );

    expect(clients).toHaveLength(2);
    expect(clients[0]).toBe(clients[1]);
  });
});
