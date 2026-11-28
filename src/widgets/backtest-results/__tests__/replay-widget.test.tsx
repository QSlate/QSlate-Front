// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type BacktestResult, EMPTY_METRICS } from '@/entities/backtest';
import { apiClient } from '@/shared/api';
import { renderWithQuery } from '@/shared/lib/test';

import { ReplayWidget } from '../ui/replay-widget';

const backtest = vi.fn();
vi.mock('@/features/run-backtest', () => ({
  useBacktest: () => backtest(),
}));
// The canvas needs a real browser: the player logic is what is tested here.
vi.mock('next/dynamic', () => ({
  default: () =>
    function CanvasStub() {
      return <div data-chart="stub" />;
    },
}));

const HOUR = 3_600;
const START = Date.UTC(2025, 0, 1) / 1_000;
const CANDLES = 6;

const RESULT: BacktestResult = {
  id: 'bt',
  metrics: { ...EMPTY_METRICS, initialCapital: 10_000 },
  equity: Array.from({ length: CANDLES }, (_, index) => ({
    time: START + index * HOUR,
    equity: 10_000 + index * 100,
    drawdownPct: 0,
  })),
  trades: [
    {
      id: 'a',
      side: 'long',
      entryTime: START + HOUR,
      exitTime: START + 3 * HOUR,
      entryPrice: 101,
      exitPrice: 104,
      sizeUsd: 1_000,
      pnlUsd: 30,
      pnlPct: 3,
      feeUsd: null,
      exitReason: null,
    },
  ],
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

function mockMarket() {
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
  vi.spyOn(apiClient, 'getMarketHistory').mockResolvedValue({
    symbol: 'ETH/USDT',
    resolution: '1h',
    items: Array.from({ length: CANDLES }, (_, index) => ({
      time: new Date((START + index * HOUR) * 1_000).toISOString(),
      open: String(100 + index),
      high: String(102 + index),
      low: String(99 + index),
      close: String(101 + index),
      volume: '10',
    })),
    next_cursor: null,
  });
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function slider() {
  return screen.getByRole('slider', { name: 'Position dans le backtest' });
}

describe('ReplayWidget', () => {
  it('shows an empty state without a backtest', () => {
    withRun(null);
    renderWithQuery(<ReplayWidget />);
    expect(
      screen.getByText('Lance un backtest pour le rejouer bougie par bougie.')
    ).toBeTruthy();
  });

  it('starts on the first candle with the figures of that moment', async () => {
    withRun(RESULT);
    mockMarket();
    renderWithQuery(<ReplayWidget />);
    expect(
      await screen.findByRole('button', { name: 'Lancer le replay' })
    ).toBeTruthy();
    expect(slider().getAttribute('aria-valuetext')).toMatch(/bougie 1 sur 6$/u);
    expect(screen.getByText('10 000 USD')).toBeTruthy();
    expect(
      screen.getByText('Aucun ordre de la stratégie pour l’instant.')
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Bougie précédente' })
    ).toHaveProperty('disabled', true);
  });

  it('steps with the buttons and the keyboard, and shows the orders', async () => {
    withRun(RESULT);
    mockMarket();
    renderWithQuery(<ReplayWidget />);
    const next = await screen.findByRole('button', { name: 'Bougie suivante' });
    fireEvent.click(next);
    expect(slider()).toHaveProperty('value', '1');
    expect(
      screen.getByText('▲ Achat · entrée long', { selector: 'b' })
    ).toBeTruthy();

    fireEvent.keyDown(slider(), { key: 'ArrowRight', shiftKey: true });
    expect(slider()).toHaveProperty('value', '3');
    expect(
      screen.getByText('▼ Vente · sortie long', { selector: 'b' })
    ).toBeTruthy();
    expect(screen.getByText(/▲ \+3,00 % \(\+30 USD\)/u)).toBeTruthy();
    expect(
      screen.getByRole('region', { name: /Ordres de la stratégie jusqu’au/u })
    ).toBeTruthy();

    fireEvent.keyDown(slider(), { key: 'End' });
    expect(
      screen.getByRole('button', { name: 'Rejouer depuis le début' })
    ).toBeTruthy();
    fireEvent.keyDown(slider(), { key: 'Home' });
    expect(slider()).toHaveProperty('value', '0');
  });

  it('toggles the playback with Space and seeks with the timeline', async () => {
    withRun(RESULT);
    mockMarket();
    renderWithQuery(<ReplayWidget />);
    await screen.findByRole('button', { name: 'Lancer le replay' });
    fireEvent.keyDown(slider(), { key: ' ' });
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
    fireEvent.change(slider(), { target: { value: '4' } });
    expect(screen.getByRole('button', { name: 'Lecture' })).toBeTruthy();
    expect(slider()).toHaveProperty('value', '4');
  });

  it('changes the speed and the pause on trades', async () => {
    withRun(RESULT);
    mockMarket();
    renderWithQuery(<ReplayWidget />);
    const fastest = await screen.findByRole('button', {
      name: '×50, 200 bougies par seconde',
    });
    fireEvent.click(fastest);
    expect(fastest.getAttribute('aria-pressed')).toBe('true');
    const stop = screen.getByRole('switch', { name: 'Pause sur les trades' });
    fireEvent.click(stop);
    expect(stop.getAttribute('aria-checked')).toBe('true');
  });
});
