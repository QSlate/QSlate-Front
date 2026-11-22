// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type BacktestResult, EMPTY_METRICS } from '@/entities/backtest';

import {
  MaxDrawdownWidget,
  NetReturnWidget,
  WinRateWidget,
} from '../ui/kpi-widgets';
import { TradesTableWidget } from '../ui/trade-widgets';

const backtest = vi.fn();
vi.mock('@/features/run-backtest', () => ({
  useBacktest: () => backtest(),
}));

const RESULT: BacktestResult = {
  id: 'bt',
  metrics: {
    ...EMPTY_METRICS,
    returnPct: 18.4,
    netProfitUsd: 1842,
    initialCapital: 10_000,
    finalCapital: 11_842,
    maxDrawdownPct: 4.2,
    totalTrades: 0,
  },
  equity: [],
  trades: [],
  truncated: false,
};

function withResult(result: BacktestResult | null, status = 'idle') {
  backtest.mockReturnValue({
    result,
    resultStatus: result ? 'ready' : 'empty',
    status,
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('result widgets', () => {
  it('shows empty states without a backtest (no fake values)', () => {
    withResult(null);
    render(<NetReturnWidget />);
    expect(screen.getByText('Disponible après un backtest')).toBeTruthy();
  });

  it('shows the net return with an arrow and the capital change', () => {
    withResult(RESULT);
    render(<NetReturnWidget />);
    expect(screen.getByText('▲ +18,4 %')).toBeTruthy();
    expect(screen.getByText('+1 842 USD')).toBeTruthy();
  });

  it('shows the drawdown as a loss and hides unreported metrics', () => {
    withResult(RESULT);
    render(<MaxDrawdownWidget />);
    expect(screen.getByText('▼ −4,2 %')).toBeTruthy();
    cleanup();
    render(<WinRateWidget />);
    expect(screen.getByText(/Aucun trade/)).toBeTruthy();
  });

  it('marks widgets busy while a run is live', () => {
    withResult(RESULT, 'running');
    render(<TradesTableWidget />);
    expect(
      screen.getByRole('group', { name: 'Trades' }).getAttribute('aria-busy')
    ).toBe('true');
  });

  it('filters trades by outcome', () => {
    withResult({
      ...RESULT,
      trades: [
        {
          id: 'a',
          side: 'long',
          entryTime: 1,
          exitTime: 2,
          entryPrice: 10,
          exitPrice: 11,
          sizeUsd: 100,
          pnlUsd: 10,
          pnlPct: 10,
          feeUsd: 0,
          exitReason: 'Take Profit',
        },
        {
          id: 'b',
          side: 'short',
          entryTime: 3,
          exitTime: 4,
          entryPrice: 10,
          exitPrice: 11,
          sizeUsd: 100,
          pnlUsd: -10,
          pnlPct: -10,
          feeUsd: 0,
          exitReason: 'Stop Loss',
        },
      ],
    });
    render(<TradesTableWidget />);
    expect(screen.getAllByRole('row')).toHaveLength(3);
    screen.getByRole('button', { name: 'Perdants' }).click();
  });
});
