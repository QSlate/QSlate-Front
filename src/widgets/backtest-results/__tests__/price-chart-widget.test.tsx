// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type BacktestResult, EMPTY_METRICS } from '@/entities/backtest';
import { apiClient } from '@/shared/api';
import { renderWithQuery } from '@/shared/lib/test';

import { PriceChartWidget } from '../ui/price-chart-widget';

const backtest = vi.fn();
vi.mock('@/features/run-backtest', () => ({
  useBacktest: () => backtest(),
}));
// The canvas needs a real browser: the widget logic is what is tested here.
vi.mock('next/dynamic', () => ({
  default: () =>
    function CanvasStub() {
      return <div data-chart="stub" />;
    },
}));

const HOUR = 3_600;
const START = Date.UTC(2025, 0, 1) / 1_000;

const RESULT: BacktestResult = {
  id: 'bt',
  metrics: EMPTY_METRICS,
  equity: [
    { time: START, equity: 10_000, drawdownPct: 0 },
    { time: START + HOUR, equity: 10_100, drawdownPct: 0 },
  ],
  trades: [],
  truncated: false,
};

function withRun(result: BacktestResult | null) {
  backtest.mockReturnValue({
    result,
    resultStatus: result ? 'ready' : 'empty',
    status: 'idle',
    lastRun: result
      ? {
          backtestId: 'bt',
          startedAt: 0,
          finishedAt: 1,
          descriptor: {
            strategyId: 's',
            datasetId: 'public-eth',
            datasetVersionId: 'v1',
            initialCapital: 10_000,
            commissionRate: 0,
          },
        }
      : null,
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('PriceChartWidget', () => {
  it('shows an empty state without a backtest', () => {
    withRun(null);
    renderWithQuery(<PriceChartWidget />);
    expect(screen.getByText(/Lance un backtest pour voir/)).toBeTruthy();
  });

  it('loads the run candles and shows the OHLC legend and data table', async () => {
    withRun(RESULT);
    vi.spyOn(apiClient, 'getMarketSymbols').mockResolvedValue({
      items: [
        {
          symbol: 'ETH/USDT@1h',
          name: 'Ether',
          dataset_id: 'public-eth',
          version_id: 'v2',
          resolution: '1h',
          live: false,
        },
      ],
    });
    const history = vi.spyOn(apiClient, 'getMarketHistory').mockResolvedValue({
      symbol: 'ETH/USDT',
      resolution: '1h',
      items: [
        {
          time: new Date(START * 1_000).toISOString(),
          open: '100',
          high: '110',
          low: '95',
          close: '105',
          volume: '12',
        },
      ],
      next_cursor: null,
    });
    renderWithQuery(<PriceChartWidget />);
    expect(await screen.findByText(/▲ \+5,00 %/u)).toBeTruthy();
    expect(history).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'ETH/USDT@1h', version_id: 'v1' })
    );
    expect(
      screen.getByRole('region', { name: /Prix mensuels de ETH \/ USDT/ })
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: '1 mois' })).toBeTruthy();
  });
});
