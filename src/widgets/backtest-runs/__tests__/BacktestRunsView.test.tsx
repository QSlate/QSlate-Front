// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/entities/user/model';
import { useLabStore } from '@/features/lab-state';
import { apiClient } from '@/shared/api';
import { AppearanceProvider } from '@/shared/theme';

import { BacktestRunsView } from '../ui/BacktestRunsView';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('BacktestRunsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLabStore.setState({
      activeTab: 'runs',
      toast: null,
      loadedBacktestId: null,
    });
    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: 'test-token',
    });

    vi.spyOn(apiClient, 'getBacktests').mockResolvedValue({
      items: [
        {
          backtest_id: 'bt-9021',
          status: 'completed',
          progress: 100,
          input: {
            strategy_id: 'strat-momentum-eth',
            strategy_name: 'Momentum_ETH_4h.py · v3.2',
            dataset_id: 'binance-eth-4h',
          },
          created_at: '2026-06-30T16:04:12Z',
          updated_at: '2026-06-30T16:05:00Z',
        },
        {
          backtest_id: 'bt-9020',
          status: 'running',
          progress: 65,
          input: {
            strategy_id: 'strat-vol-btc',
            strategy_name: 'Vol_Breakout_BTC_1h.py',
            dataset_id: 'binance-btc-1h',
          },
          created_at: '2026-06-29T11:15:30Z',
          updated_at: '2026-06-29T11:16:00Z',
        },
      ],
      next_cursor: 'cursor-page-2',
    });

    vi.spyOn(apiClient, 'getBacktestSummary').mockResolvedValue({
      backtest_id: 'bt-9021',
      metrics: {
        sharpe_ratio: 2.41,
        total_return: 0.292,
        max_drawdown: 0.087,
        trades_count: 1284,
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders table with runs fetched from backend API and displays summary metrics', async () => {
    render(<BacktestRunsView />);

    expect(screen.getByText('Backtest Execution History')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('bt-9021')).toBeDefined();
      expect(screen.getByText('Momentum_ETH_4h.py · v3.2')).toBeDefined();
      expect(screen.getByText('binance-eth-4h')).toBeDefined();
      expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Running (65%)')).toBeDefined();
      expect(screen.getByText('2.41')).toBeDefined();
      expect(screen.getByText('29.2%')).toBeDefined();
      expect(screen.getByText('1,284')).toBeDefined();
    });
  });

  it('filters runs by search query', async () => {
    render(<BacktestRunsView />);

    await waitFor(() => {
      expect(screen.getByText('bt-9021')).toBeDefined();
      expect(screen.getByText('bt-9020')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText(
      /search run, strategy, dataset.../i
    );
    fireEvent.change(searchInput, { target: { value: 'Momentum' } });

    expect(screen.getByText('bt-9021')).toBeDefined();
    expect(screen.queryByText('bt-9020')).toBeNull();
  });

  it('filters runs by status filter pill tabs', async () => {
    render(<BacktestRunsView />);

    await waitFor(() => {
      expect(screen.getByText('bt-9021')).toBeDefined();
      expect(screen.getByText('bt-9020')).toBeDefined();
    });

    // Click "Running" filter pill
    const runningPill = screen.getByRole('button', { name: /^running$/i });
    fireEvent.click(runningPill);

    expect(screen.queryByText('bt-9021')).toBeNull();
    expect(screen.getByText('bt-9020')).toBeDefined();

    // Click "Completed" filter pill
    const completedPill = screen.getByRole('button', { name: /^completed$/i });
    fireEvent.click(completedPill);

    expect(screen.getByText('bt-9021')).toBeDefined();
    expect(screen.queryByText('bt-9020')).toBeNull();
  });

  it('loads run into Lab workspace when clicking Load button', async () => {
    render(<BacktestRunsView />);

    await waitFor(() => {
      expect(screen.getByText('bt-9021')).toBeDefined();
    });

    const loadButtons = screen.getAllByRole('button', { name: /load/i });
    fireEvent.click(loadButtons[0]);

    expect(useLabStore.getState().loadedBacktestId).toBe('bt-9021');
    expect(useLabStore.getState().activeTab).toBe('workspace');
    expect(mockPush).toHaveBeenCalledWith('/lab');
  });

  it('deletes backtest run using live API method', async () => {
    const deleteSpy = vi
      .spyOn(apiClient, 'deleteBacktest')
      .mockResolvedValueOnce(undefined);

    render(<BacktestRunsView />);

    await waitFor(() => {
      expect(screen.getByText('bt-9021')).toBeDefined();
    });

    const deleteButtons = screen.getAllByTitle('Delete run');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('bt-9021', 'test-token');
      expect(screen.queryByText('bt-9021')).toBeNull();
    });
  });

  it('renders empty state when no runs exist', async () => {
    vi.spyOn(apiClient, 'getBacktests').mockResolvedValueOnce({
      items: [],
    });

    render(<BacktestRunsView />);

    await waitFor(() => {
      expect(screen.getByText('No Backtest Runs Found')).toBeDefined();
      expect(screen.getByText('Launch First Backtest')).toBeDefined();
    });

    const launchBtn = screen.getByRole('button', {
      name: /launch first backtest/i,
    });
    fireEvent.click(launchBtn);
    expect(useLabStore.getState().activeTab).toBe('workspace');
    expect(mockPush).toHaveBeenCalledWith('/lab');
  });

  it('renders correctly in light theme mode', async () => {
    const { container } = render(
      <AppearanceProvider value={{ theme: 'light', colorblindMode: 'none' }}>
        <BacktestRunsView />
      </AppearanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('bt-9021')).toBeDefined();
    });

    expect(container).toBeDefined();
  });
});
