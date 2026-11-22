import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';

/** Fresh QueryClient for tests: no retries, no cache sharing between tests. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

/** Renders `ui` inside a QueryClientProvider (test helper). */
export function renderWithQuery(
  ui: ReactElement,
  client: QueryClient = createTestQueryClient()
): RenderResult & { readonly queryClient: QueryClient } {
  return {
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
    queryClient: client,
  };
}
