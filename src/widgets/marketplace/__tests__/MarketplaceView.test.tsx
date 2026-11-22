// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient, type MarketplaceItem } from '@/shared/api';
import { renderWithQuery } from '@/shared/lib/test';

import { MarketplaceView } from '../ui/MarketplaceView';

const ITEM: MarketplaceItem = {
  id: 'i'.repeat(43),
  kind: 'strategy',
  version_id: 'v1',
  author_id: 1,
  name: 'Alpha Breakout',
  description: 'Breakout strategy',
  category: 'strategies',
  visibility: 'public',
  revision: 1,
  install_count: 3,
  review_count: 0,
  average_rating: 0,
  created_at: '',
  updated_at: '',
};

beforeEach(() => {
  vi.spyOn(apiClient, 'getInstalledWidgets').mockResolvedValue({ items: [] });
  vi.spyOn(apiClient, 'getStrategies').mockResolvedValue({ items: [] });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('MarketplaceView', () => {
  it('lists only items returned by the backend', async () => {
    vi.spyOn(apiClient, 'getMarketplaceItems').mockResolvedValue({
      items: [ITEM],
    });
    renderWithQuery(<MarketplaceView />);
    expect(await screen.findByText('Alpha Breakout')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText("Pas encore d'avis")).toBeTruthy();
  });

  it('installs an item with its version', async () => {
    vi.spyOn(apiClient, 'getMarketplaceItems').mockResolvedValue({
      items: [ITEM],
    });
    const install = vi
      .spyOn(apiClient, 'installMarketplaceItem')
      .mockResolvedValue({
        item_id: ITEM.id,
        version_id: 'v1',
        kind: 'strategy',
        catalog_id: 'c',
        installed_at: '',
      });
    renderWithQuery(<MarketplaceView />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Installer Alpha Breakout' })
    );
    await waitFor(() => expect(install).toHaveBeenCalledWith(ITEM.id, 'v1'));
  });

  it('shows an empty state when nothing is published', async () => {
    vi.spyOn(apiClient, 'getMarketplaceItems').mockResolvedValue({ items: [] });
    renderWithQuery(<MarketplaceView />);
    expect(await screen.findByText('La marketplace est vide')).toBeTruthy();
  });
});
