// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api';
import { renderWithQuery } from '@/shared/lib/test';

import { DatasetsView } from '../ui/datasets-view';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('DatasetsView', () => {
  it('lists public datasets and the user datasets with their status', async () => {
    vi.spyOn(apiClient, 'getMarketSymbols').mockResolvedValue({
      items: [
        {
          symbol: 'BTC/USDT@1h',
          name: 'Bitcoin / Tether — 1 hour',
          dataset_id: 'public-btc-usdt-1h',
          version_id: 'v1',
          resolution: '1h',
          live: false,
        },
      ],
    });
    vi.spyOn(apiClient, 'getCustomDatasets').mockResolvedValue({
      items: [
        {
          id: 'a',
          version_id: 'v',
          name: 'Mon CSV',
          status: 'failed',
          format: 'csv',
          columns: [],
          row_count: 0,
          symbol: 'custom:a',
          error: 'high < low',
          created_at: '2026-01-02T00:00:00Z',
          updated_at: '',
        },
      ],
    });
    renderWithQuery(<DatasetsView />);
    expect(await screen.findByText('BTC / USDT · 1 h')).toBeTruthy();
    expect(await screen.findByText('Mon CSV')).toBeTruthy();
    expect(screen.getByText('Échec')).toBeTruthy();
    expect(screen.getByText('high < low')).toBeTruthy();
  });

  it('shows an empty state without own datasets', async () => {
    vi.spyOn(apiClient, 'getMarketSymbols').mockResolvedValue({ items: [] });
    vi.spyOn(apiClient, 'getCustomDatasets').mockResolvedValue({ items: [] });
    renderWithQuery(<DatasetsView />);
    expect(await screen.findByText('Aucun fichier importé')).toBeTruthy();
  });
});
