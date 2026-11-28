import { describe, expect, it } from 'vitest';

import {
  type BacktestResult,
  EMPTY_METRICS,
  type Trade,
} from '@/entities/backtest';

import { advanceCursor, buildReplayTimeline } from '../model/replay-timeline';

const HOUR = 3_600;
const START = Date.UTC(2025, 0, 1) / 1_000;
const TIMES = Array.from({ length: 10 }, (_, index) => START + index * HOUR);

function trade(overrides: Partial<Trade>): Trade {
  return {
    id: 't',
    side: 'long',
    entryTime: START,
    exitTime: null,
    entryPrice: 100,
    exitPrice: null,
    sizeUsd: 1_000,
    pnlUsd: null,
    pnlPct: null,
    feeUsd: null,
    exitReason: null,
    ...overrides,
  };
}

const RESULT: BacktestResult = {
  id: 'bt',
  metrics: { ...EMPTY_METRICS, initialCapital: 10_000 },
  equity: TIMES.map((time, index) => ({
    time,
    equity: index < 5 ? 10_000 + index * 100 : 10_400 - (index - 4) * 50,
    drawdownPct: index < 5 ? 0 : -((index - 4) * 50 * 100) / 10_400,
  })),
  trades: [
    trade({
      id: 'a',
      entryTime: START + 1 * HOUR + 60,
      exitTime: START + 3 * HOUR,
      exitPrice: 110,
      pnlUsd: 100,
      pnlPct: 10,
    }),
    trade({
      id: 'b',
      side: 'short',
      entryTime: START + 5 * HOUR,
      exitTime: START + 7 * HOUR,
      pnlUsd: -40,
      pnlPct: -4,
    }),
    trade({ id: 'c', entryTime: START + 8 * HOUR }),
  ],
  truncated: false,
};

describe('buildReplayTimeline', () => {
  const timeline = buildReplayTimeline(RESULT, TIMES);

  it('snaps orders to their candle, with the side-aware action', () => {
    expect(
      timeline.events.map((event) => [
        event.candleIndex,
        event.kind,
        event.action,
      ])
    ).toEqual([
      [1, 'entry', 'buy'],
      [3, 'exit', 'sell'],
      [5, 'entry', 'sell'],
      [7, 'exit', 'buy'],
      [8, 'entry', 'buy'],
    ]);
  });

  it('reads the figures at the cursor only from the result', () => {
    expect(timeline.figuresAt(0)).toMatchObject({
      capital: 10_000,
      returnPct: 0,
      closedTrades: 0,
      winRatePct: null,
      lastEvent: null,
    });
    const middle = timeline.figuresAt(4);
    expect(middle.capital).toBe(10_400);
    expect(middle.returnPct).toBeCloseTo(4);
    expect(middle.closedTrades).toBe(1);
    expect(middle.winRatePct).toBe(100);
    expect(middle.lastEvent?.trade.id).toBe('a');
    const late = timeline.figuresAt(7);
    expect(late.drawdownPct).toBeLessThan(0);
    expect(late.closedTrades).toBe(2);
    expect(late.winRatePct).toBe(50);
  });

  it('clamps the cursor to the candles', () => {
    expect(timeline.figuresAt(-3).capital).toBe(10_000);
    expect(timeline.figuresAt(99).lastEvent?.trade.id).toBe('c');
  });

  it('finds the previous and next order candles', () => {
    expect(timeline.previousEventCandle(0)).toBeNull();
    expect(timeline.previousEventCandle(3)).toBe(1);
    expect(timeline.nextEventCandle(3)).toBe(5);
    expect(timeline.nextEventCandle(8)).toBeNull();
    expect(timeline.eventCountAt(5)).toBe(3);
  });

  it('has no figures without equity', () => {
    const empty = buildReplayTimeline(
      { ...RESULT, equity: [], trades: [], metrics: EMPTY_METRICS },
      TIMES
    );
    expect(empty.figuresAt(3)).toMatchObject({
      capital: null,
      returnPct: null,
      drawdownPct: null,
    });
  });
});

describe('advanceCursor', () => {
  it('reveals 4 candles per second at ×1 and keeps the remainder', () => {
    expect(advanceCursor(0, 0, 250, 1, 100, null)).toEqual({
      cursor: 1,
      carry: 0,
      stop: false,
    });
    const partial = advanceCursor(0, 0, 100, 1, 100, null);
    expect(partial.cursor).toBe(0);
    expect(partial.carry).toBeCloseTo(0.4);
  });

  it('scales with the speed and stops at the end', () => {
    expect(advanceCursor(0, 0, 100, 50, 100, null).cursor).toBe(20);
    expect(advanceCursor(95, 0, 1_000, 50, 100, null)).toEqual({
      cursor: 100,
      carry: 0,
      stop: true,
    });
  });

  it('stops on the next order instead of passing it', () => {
    expect(advanceCursor(0, 0, 1_000, 50, 100, 12)).toEqual({
      cursor: 12,
      carry: 0,
      stop: true,
    });
  });
});
