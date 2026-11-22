// @vitest-environment jsdom
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api';
import { renderWithQuery } from '@/shared/lib/test';
import { AppearanceProvider } from '@/shared/theme';

import { MiniIdeView } from '../ui/MiniIdeView';

vi.mock('../ui/MonacoEditorWrapper', () => ({
  MonacoEditorWrapper: ({ value }: { readonly value: string }) => (
    <pre aria-label="Code">{value}</pre>
  ),
}));

const STRATEGY = {
  id: 's'.repeat(43),
  version_id: 'v'.repeat(43),
  revision: 2,
  name: 'RsiTrend',
  created_at: '',
  updated_at: '',
};

beforeEach(() => {
  vi.spyOn(apiClient, 'lintStrategy').mockResolvedValue({
    valid: true,
    diagnostics: [],
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderIde() {
  return renderWithQuery(
    <AppearanceProvider value={{ theme: 'dark', colorblindMode: 'none' }}>
      <MiniIdeView />
    </AppearanceProvider>
  );
}

describe('MiniIdeView', () => {
  it('opens the first real strategy with its saved source', async () => {
    vi.spyOn(apiClient, 'getStrategies').mockResolvedValue({
      items: [STRATEGY],
    });
    vi.spyOn(apiClient, 'getStrategy').mockResolvedValue({
      ...STRATEGY,
      source: 'class RsiTrend: pass',
      parameters: {},
    });
    renderIde();
    expect(await screen.findByText('class RsiTrend: pass')).toBeTruthy();
    expect(
      screen
        .getByRole('button', { name: /RsiTrend/ })
        .getAttribute('aria-current')
    ).toBe('true');
  });

  it('explains how to start without any strategy', async () => {
    vi.spyOn(apiClient, 'getStrategies').mockResolvedValue({ items: [] });
    renderIde();
    await waitFor(() =>
      expect(screen.getByText('Commence ta première stratégie')).toBeTruthy()
    );
  });
});
