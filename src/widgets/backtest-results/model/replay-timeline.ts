import type { BacktestResult, Trade } from '@/entities/backtest';

import { candleIndexAt, type TradeAction } from './price-markers';

/** Playback multipliers offered by the player. */
export const REPLAY_SPEEDS = [1, 5, 10, 50] as const;
export type ReplaySpeed = (typeof REPLAY_SPEEDS)[number];

/** Candles revealed per second at ×1. */
export const BASE_CANDLES_PER_SECOND = 4;

/** An order of the strategy, placed on the candle that holds it. */
export interface ReplayEvent {
  readonly candleIndex: number;
  readonly action: TradeAction;
  readonly kind: 'entry' | 'exit';
  readonly trade: Trade;
}

/** What the replay knows at a given candle, from the backtest result only. */
export interface ReplayFigures {
  /** Capital at the cursor; null before the first equity point. */
  readonly capital: number | null;
  /** Change since the start of the run, in %; null without capital. */
  readonly returnPct: number | null;
  /** Gap to the running peak, in % (≤ 0); null without capital. */
  readonly drawdownPct: number | null;
  readonly closedTrades: number;
  /** Share of closed trades with a known gain, in %; null when none. */
  readonly winRatePct: number | null;
  /** Latest order at or before the cursor. */
  readonly lastEvent: ReplayEvent | null;
}

export interface ReplayTimeline {
  readonly length: number;
  /** Orders sorted by candle. */
  readonly events: readonly ReplayEvent[];
  /** Candle index → figures at that candle. */
  readonly figuresAt: (cursor: number) => ReplayFigures;
  /** Number of orders at or before the cursor. */
  readonly eventCountAt: (cursor: number) => number;
  /** Candle of the closest order strictly before the cursor, or null. */
  readonly previousEventCandle: (cursor: number) => number | null;
  /** Candle of the closest order strictly after the cursor, or null. */
  readonly nextEventCandle: (cursor: number) => number | null;
}

/** Number of sorted values ≤ `value`. */
function countAtOrBefore(values: readonly number[], value: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((values[middle] ?? Infinity) <= value) low = middle + 1;
    else high = middle;
  }
  return low;
}

function buildEvents(
  trades: readonly Trade[],
  times: readonly number[]
): ReplayEvent[] {
  const events: ReplayEvent[] = [];
  const add = (
    time: number | null,
    trade: Trade,
    kind: ReplayEvent['kind']
  ) => {
    if (time === null) return;
    const candleIndex = candleIndexAt(times, time);
    if (candleIndex < 0) return;
    const opensLong = trade.side === 'long';
    const buys = kind === 'entry' ? opensLong : !opensLong;
    events.push({ candleIndex, kind, trade, action: buys ? 'buy' : 'sell' });
  };
  for (const trade of trades) {
    add(trade.entryTime, trade, 'entry');
    add(trade.exitTime, trade, 'exit');
  }
  // Stable: an entry and exit on the same candle keep their order.
  return events.sort((left, right) => left.candleIndex - right.candleIndex);
}

/**
 * Precomputes everything the player reads at each frame, so moving the
 * cursor costs O(log n): orders per candle, closed trades and wins so far,
 * and the equity point of each candle.
 */
export function buildReplayTimeline(
  result: BacktestResult,
  candleTimes: readonly number[]
): ReplayTimeline {
  const length = candleTimes.length;
  const events = buildEvents(result.trades, candleTimes);
  const eventCandles = events.map((event) => event.candleIndex);

  // Closed trades and winners after each event (cumulative).
  const closedAfter: number[] = [];
  const winsAfter: number[] = [];
  const knownAfter: number[] = [];
  let closed = 0;
  let wins = 0;
  let known = 0;
  for (const event of events) {
    if (event.kind === 'exit') {
      closed += 1;
      const pnl = event.trade.pnlUsd;
      if (pnl !== null) {
        known += 1;
        if (pnl > 0) wins += 1;
      }
    }
    closedAfter.push(closed);
    winsAfter.push(wins);
    knownAfter.push(known);
  }

  // Equity point index of each candle (last point at or before it).
  const equityTimes = result.equity.map((point) => point.time);
  const equityOf = new Int32Array(length);
  for (let index = 0; index < length; index += 1) {
    equityOf[index] =
      countAtOrBefore(equityTimes, candleTimes[index] ?? -Infinity) - 1;
  }
  const initialCapital =
    result.metrics.initialCapital ?? result.equity[0]?.equity ?? null;

  const clamp = (cursor: number) =>
    Math.min(Math.max(Math.round(cursor), 0), Math.max(length - 1, 0));
  const eventCountAt = (cursor: number) =>
    countAtOrBefore(eventCandles, clamp(cursor));

  return {
    length,
    events,
    eventCountAt,
    figuresAt: (cursor) => {
      const index = clamp(cursor);
      const point = result.equity[equityOf[index] ?? -1] ?? null;
      const count = eventCountAt(index);
      const closedTrades = closedAfter[count - 1] ?? 0;
      const knownTrades = knownAfter[count - 1] ?? 0;
      const capital = point?.equity ?? null;
      return {
        capital,
        returnPct:
          capital !== null && initialCapital
            ? (capital / initialCapital - 1) * 100
            : null,
        drawdownPct: point?.drawdownPct ?? null,
        closedTrades,
        winRatePct:
          knownTrades > 0
            ? ((winsAfter[count - 1] ?? 0) / knownTrades) * 100
            : null,
        lastEvent: events[count - 1] ?? null,
      };
    },
    previousEventCandle: (cursor) => {
      const count = countAtOrBefore(eventCandles, clamp(cursor) - 1);
      return eventCandles[count - 1] ?? null;
    },
    nextEventCandle: (cursor) => {
      const count = countAtOrBefore(eventCandles, clamp(cursor));
      return eventCandles[count] ?? null;
    },
  };
}

export interface AdvanceResult {
  readonly cursor: number;
  /** Fraction of a candle carried to the next frame. */
  readonly carry: number;
  /** True when playback must stop (end reached or order met). */
  readonly stop: boolean;
}

/**
 * Moves the cursor by the candles due after `elapsedMs` at `speed`. With
 * `stopAt` (next order candle), the cursor stops on it instead of passing.
 */
export function advanceCursor(
  cursor: number,
  carry: number,
  elapsedMs: number,
  speed: ReplaySpeed,
  lastIndex: number,
  stopAt: number | null
): AdvanceResult {
  const due = carry + (elapsedMs / 1_000) * BASE_CANDLES_PER_SECOND * speed;
  const steps = Math.floor(due);
  let next = Math.min(cursor + steps, lastIndex);
  let stop = next >= lastIndex;
  if (stopAt !== null && stopAt > cursor && stopAt <= next) {
    next = stopAt;
    stop = true;
  }
  return { cursor: next, carry: stop ? 0 : due - steps, stop };
}
