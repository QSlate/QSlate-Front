// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLabStore } from '@/features/lab-state';
import { apiClient, type BacktestJob } from '@/shared/api';
import { renderWithQuery } from '@/shared/lib/test';

import { BacktestRunsView } from '../ui/BacktestRunsView';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

function job(id: string, status: BacktestJob['status']): BacktestJob {
  return {
    backtest_id: id,
    status,
    progress: status === 'running' ? 40 : 100,
    input: {
      strategy_id: 's1',
      dataset_id: 'public-btc-usdt-1h',
      initial_capital: '10000',
    },
    created_at: '2026-11-20T10:00:00Z',
    updated_at: '2026-11-20T10:01:00Z',
  };
}

beforeEach(() => {
  vi.spyOn(apiClient, 'getStrategies').mockResolvedValue({
    items: [
      {
        id: 's1',
        version_id: 'v',
        revision: 1,
        name: 'RsiTrend',
        created_at: '',
        updated_at: '',
      },
    ],
  });
  vi.spyOn(apiClient, 'getMarketSymbols').mockResolvedValue({
    items: [
      {
        symbol: 'BTC/USDT@1h',
        name: 'Bitcoin',
        dataset_id: 'public-btc-usdt-1h',
        version_id: 'v',
        resolution: '1h',
        live: false,
      },
    ],
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('BacktestRunsView', () => {
  it('lists runs with readable labels and status', async () => {
    vi.spyOn(apiClient, 'getBacktests').mockResolvedValue({
      items: [job('a', 'completed'), job('b', 'running')],
    });
    renderWithQuery(<BacktestRunsView />);
    expect(
      (await screen.findAllByText('RsiTrend · BTC / USDT · 1 h')).length
    ).toBe(2);
    expect(screen.getByText('Terminé')).toBeTruthy();
    expect(screen.getByText(/40 %/)).toBeTruthy();
  });

  it('opens a completed run in the lab', async () => {
    vi.spyOn(apiClient, 'getBacktests').mockResolvedValue({
      items: [job('a', 'completed')],
    });
    renderWithQuery(<BacktestRunsView />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir' }));
    expect(useLabStore.getState().loadedBacktestId).toBe('a');
    expect(mockPush).toHaveBeenCalledWith('/lab');
  });

  it('enables comparison from two completed runs', async () => {
    vi.spyOn(apiClient, 'getBacktests').mockResolvedValue({
      items: [job('a', 'completed'), job('b', 'completed')],
    });
    renderWithQuery(<BacktestRunsView />);
    const boxes = await screen.findAllByRole('checkbox');
    const compare = screen.getByRole('button', { name: /Comparer/ });
    expect(compare.hasAttribute('disabled')).toBe(true);
    boxes.forEach((box) => fireEvent.click(box));
    expect(
      screen
        .getByRole('button', { name: 'Comparer (2)' })
        .hasAttribute('disabled')
    ).toBe(false);
  });

  it('shows an empty state without runs', async () => {
    vi.spyOn(apiClient, 'getBacktests').mockResolvedValue({ items: [] });
    renderWithQuery(<BacktestRunsView />);
    expect(
      await screen.findByText('Aucun backtest pour le moment')
    ).toBeTruthy();
  });
});
