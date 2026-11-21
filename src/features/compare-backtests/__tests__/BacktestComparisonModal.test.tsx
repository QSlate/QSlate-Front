// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/entities/user/model';
import { apiClient } from '@/shared/api';

import { BacktestComparisonModal } from '../ui/BacktestComparisonModal';

describe('BacktestComparisonModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ accessToken: 'test-token', isAuthenticated: true });
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <BacktestComparisonModal
        isOpen={false}
        onClose={vi.fn()}
        selectedRunIds={['b-1', 'b-2']}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders comparative analytics and equity curve overlay for selected runs', async () => {
    vi.spyOn(apiClient, 'compareBacktests').mockResolvedValueOnce({
      summaries: [
        {
          backtest_id: 'b-alpha-01',
          strategy_version_id: 's-v1',
          dataset_version_id: 'd-v1',
          metrics: {
            total_return: 0.42,
            sharpe_ratio: 2.35,
            max_drawdown: 0.09,
            win_rate: 0.64,
            profit_factor: 1.95,
            total_trades: 180,
          },
        },
        {
          backtest_id: 'b-beta-02',
          strategy_version_id: 's-v2',
          dataset_version_id: 'd-v1',
          metrics: {
            total_return: 0.18,
            sharpe_ratio: 1.45,
            max_drawdown: 0.15,
            win_rate: 0.52,
            profit_factor: 1.35,
            total_trades: 110,
          },
        },
      ],
    });

    vi.spyOn(apiClient, 'getBacktestEquityCurve').mockImplementation(
      async (id) => {
        if (id === 'b-alpha-01') {
          return {
            items: [
              { timestamp: 1, equity: 100000 },
              { timestamp: 2, equity: 120000 },
              { timestamp: 3, equity: 142000 },
            ],
          } as unknown as { items: [] };
        }
        return {
          items: [
            { timestamp: 1, equity: 100000 },
            { timestamp: 2, equity: 108000 },
            { timestamp: 3, equity: 118000 },
          ],
        } as unknown as { items: [] };
      }
    );

    const onClose = vi.fn();
    const onSelectRun = vi.fn();

    render(
      <BacktestComparisonModal
        isOpen={true}
        onClose={onClose}
        selectedRunIds={['b-alpha-01', 'b-beta-02']}
        onSelectRun={onSelectRun}
      />
    );

    // Initial loading state
    expect(screen.getByText(/Backtest Run Comparison/i)).toBeDefined();

    // Wait for comparison analytics to resolve
    await waitFor(() => {
      expect(screen.getByText('2 RUNS ALIGNED')).toBeDefined();
    });

    expect(
      screen.getByText(/Normalized Cumulative Return Overlay/i)
    ).toBeDefined();
    expect(
      screen.getByText(/Risk & Return Differentials Matrix/i)
    ).toBeDefined();
    expect(screen.getByText('42.00%')).toBeDefined();
    expect(screen.getByText('18.00%')).toBeDefined();
    expect(screen.getByText('2.35')).toBeDefined();
    expect(screen.getByText('1.45')).toBeDefined();

    // Check correlation matrix section
    expect(
      screen.getByText(/Strategy Return Correlation Matrix/i)
    ).toBeDefined();

    // Load run action
    const loadBtn = screen.getByText(/Load Run 1 in Lab/i);
    fireEvent.click(loadBtn);
    expect(onSelectRun).toHaveBeenCalledWith('b-alpha-01');
    expect(onClose).toHaveBeenCalled();
  });
});
