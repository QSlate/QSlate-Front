// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useAuthStore } from '@/entities/user';
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

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
});

beforeEach(() => {
  useAuthStore.setState({ isAuthenticated: false });
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

  it('lets signed-in users read and post a review', async () => {
    useAuthStore.setState({ isAuthenticated: true });
    vi.spyOn(apiClient, 'getMarketplaceItems').mockResolvedValue({
      items: [ITEM],
    });
    vi.spyOn(apiClient, 'getMarketplaceReviews').mockResolvedValue({
      items: [
        {
          id: 'r'.repeat(43),
          author_id: 2,
          rating: 4,
          comment: 'Solide',
          created_at: '2026-11-01T00:00:00Z',
        },
      ],
    });
    const post = vi
      .spyOn(apiClient, 'createMarketplaceReview')
      .mockResolvedValue({
        id: 'n'.repeat(43),
        author_id: 1,
        rating: 5,
        comment: '',
        created_at: '',
      });
    renderWithQuery(<MarketplaceView />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Avis sur Alpha Breakout' })
    );
    expect(await screen.findByText('Solide')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: '5 sur 5' }));
    fireEvent.click(screen.getByRole('button', { name: 'Publier mon avis' }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(ITEM.id, { rating: 5 })
    );
  });
});
