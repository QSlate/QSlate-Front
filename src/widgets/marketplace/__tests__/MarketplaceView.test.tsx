// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLayoutStore } from '@/entities/layout';
import { useLabStore } from '@/features/lab-state';
import { apiClient } from '@/shared/api';
import { renderWithQuery } from '@/shared/lib/test';
import { AppearanceProvider } from '@/shared/theme';

import { MarketplaceView } from '../ui/MarketplaceView';

describe('MarketplaceView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLayoutStore.getState().resetLayout();
    useLabStore.setState({
      marketplaceSearch: '',
      marketplaceCategory: 'All',
      installedMarketplaceIds: [],
      reviewingItem: null,
      toast: null,
    });

    // Default mock responses for live marketplace calls
    vi.spyOn(apiClient, 'getMarketplaceCategories').mockResolvedValue({
      items: [
        { id: 'strategies', name: 'Strategies' },
        { id: 'visualization', name: 'Visualization' },
      ],
    });

    vi.spyOn(apiClient, 'getMarketplaceFeatured').mockResolvedValue({
      items: [
        {
          id: 'feat-1',
          kind: 'strategy',
          version_id: 'ver-f1',
          author_id: 1,
          name: 'Institutional Volatility Arbitrage',
          description:
            'High-frequency statistical arbitrage on cross-venue spreads.',
          category: 'Strategies',
          visibility: 'public',
          revision: 1,
          install_count: 500,
          review_count: 12,
          average_rating: 4.9,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
    });

    vi.spyOn(apiClient, 'getMarketplaceItems').mockResolvedValue({
      items: [
        {
          id: 'mod-monte-carlo',
          kind: 'widget',
          version_id: 'v-mc-10k',
          author_id: 101,
          name: 'Monte Carlo 10k Simulator',
          description:
            'Geometric Brownian motion fan chart projecting 10,000 paths with tail risk percentiles.',
          category: 'Risk Analytics',
          visibility: 'public',
          revision: 1,
          install_count: 1420,
          review_count: 38,
          average_rating: 4.9,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'mod-order-book-heatmap',
          kind: 'widget',
          version_id: 'v-obh-2',
          author_id: 102,
          name: 'Order Book Heatmap L2',
          description:
            'Full depth-of-market liquidity migration visualizer across Binance, Bybit, and Coinbase.',
          category: 'Execution Algos',
          visibility: 'public',
          revision: 2,
          install_count: 980,
          review_count: 24,
          average_rating: 4.8,
          created_at: '2026-01-02T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
        },
      ],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders marketplace catalog and featured banner', async () => {
    renderWithQuery(<MarketplaceView />);

    expect(screen.getByText('Widget Marketplace')).toBeDefined();

    await waitFor(() => {
      expect(
        screen.getByText('Institutional Volatility Arbitrage')
      ).toBeDefined();
      expect(screen.getByText('Monte Carlo 10k Simulator')).toBeDefined();
      expect(screen.getByText('Order Book Heatmap L2')).toBeDefined();
    });
  });

  it('filters modules by search query with debouncing', async () => {
    renderWithQuery(<MarketplaceView />);

    await waitFor(() => {
      expect(screen.getByText('Monte Carlo 10k Simulator')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText(
      'Search modules, authors, signals...'
    );

    act(() => {
      fireEvent.change(searchInput, { target: { value: 'Heatmap' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Order Book Heatmap L2')).toBeDefined();
      expect(screen.queryByText('Monte Carlo 10k Simulator')).toBeNull();
    });
  });

  it('filters modules by category pill click', async () => {
    renderWithQuery(<MarketplaceView />);

    await waitFor(() => {
      expect(screen.getByText('Monte Carlo 10k Simulator')).toBeDefined();
    });

    const execPill = screen.getByRole('button', { name: 'Execution Algos' });
    act(() => {
      fireEvent.click(execPill);
    });

    await waitFor(() => {
      expect(screen.getByText('Order Book Heatmap L2')).toBeDefined();
      expect(screen.queryByText('Monte Carlo 10k Simulator')).toBeNull();
    });
  });

  it('installs and uninstalls a module using live API methods', async () => {
    const installSpy = vi
      .spyOn(apiClient, 'installMarketplaceItem')
      .mockResolvedValueOnce({
        item_id: 'mod-monte-carlo',
        version_id: 'v-mc-10k',
        kind: 'widget',
        catalog_id: 'cat-1',
        installed_at: '2026-01-01T00:00:00Z',
      });

    const uninstallSpy = vi
      .spyOn(apiClient, 'uninstallMarketplaceItem')
      .mockResolvedValueOnce();

    renderWithQuery(<MarketplaceView />);

    await waitFor(() => {
      expect(screen.getByText('Monte Carlo 10k Simulator')).toBeDefined();
    });

    // 1. Install
    const installButtons = screen.getAllByText('Install to Lab');
    expect(installButtons.length).toBeGreaterThan(0);

    act(() => {
      fireEvent.click(installButtons[0]!);
    });

    await waitFor(() => {
      expect(installSpy).toHaveBeenCalledWith('mod-monte-carlo', 'v-mc-10k');
      expect(useLabStore.getState().installedMarketplaceIds).toContain(
        'mod-monte-carlo'
      );
      expect(useLabStore.getState().toast?.type).toBe('success');
    });

    // 2. Uninstall
    const removeBtn = screen.getByText('Remove');
    act(() => {
      fireEvent.click(removeBtn);
    });

    await waitFor(() => {
      expect(uninstallSpy).toHaveBeenCalledWith('mod-monte-carlo');
      expect(useLabStore.getState().installedMarketplaceIds).not.toContain(
        'mod-monte-carlo'
      );
      expect(useLabStore.getState().toast?.type).toBe('info');
    });
  });

  it('opens ReviewModal, displays existing reviews, and posts a new review', async () => {
    vi.spyOn(apiClient, 'getMarketplaceReviews').mockResolvedValueOnce({
      items: [
        {
          id: 'rev-prev',
          author_id: 99,
          rating: 5,
          comment: 'Incredible variance estimation.',
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    });

    const createReviewSpy = vi
      .spyOn(apiClient, 'createMarketplaceReview')
      .mockResolvedValueOnce({
        id: 'rev-new-1',
        author_id: 101,
        rating: 5,
        comment: 'Accurate tail percentiles and blazing fast.',
        created_at: '2026-01-02T00:00:00Z',
      });

    renderWithQuery(<MarketplaceView />);

    await waitFor(() => {
      expect(screen.getByText('Monte Carlo 10k Simulator')).toBeDefined();
    });

    // Click the Review modal trigger button
    const reviewButtons = screen.getAllByLabelText('Open reviews modal');
    expect(reviewButtons.length).toBeGreaterThan(0);

    act(() => {
      fireEvent.click(reviewButtons[0]!);
    });

    // Check modal opened
    expect(screen.getByText('Community Reviews & Ratings')).toBeDefined();

    // Check existing review loaded
    await waitFor(() => {
      expect(screen.getByText('Incredible variance estimation.')).toBeDefined();
    });

    // Fill comment and submit
    const textarea = screen.getByPlaceholderText(
      /Share your quantitative experience/i
    );
    act(() => {
      fireEvent.change(textarea, {
        target: { value: 'Accurate tail percentiles and blazing fast.' },
      });
    });

    const submitBtn = screen.getByText('Submit Community Review');
    act(() => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(createReviewSpy).toHaveBeenCalledWith('mod-monte-carlo', {
        rating: 5,
        comment: 'Accurate tail percentiles and blazing fast.',
      });
      expect(useLabStore.getState().toast?.message).toContain(
        'review was published'
      );
    });
  });

  it('renders correctly in light theme mode', async () => {
    renderWithQuery(
      <AppearanceProvider value={{ theme: 'light', colorblindMode: 'none' }}>
        <MarketplaceView />
      </AppearanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Widget Marketplace')).toBeDefined();
      expect(screen.getByText('Monte Carlo 10k Simulator')).toBeDefined();
    });
  });
});
