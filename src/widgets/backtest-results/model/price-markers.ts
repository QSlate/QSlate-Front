import type { Trade } from '@/entities/backtest';

export type TradeAction = 'buy' | 'sell';

/** A trade order placed on the candle that contains it. */
export interface PriceMarker {
  /** Candle time (Unix seconds) the order belongs to. */
  readonly time: number;
  readonly action: TradeAction;
}

/** Markers beyond this clutter the chart without adding information. */
export const MAX_PRICE_MARKERS = 600;

/** Index of the last candle starting at or before `time` (-1 if none). */
export function candleIndexAt(times: readonly number[], time: number): number {
  let low = 0;
  let high = times.length - 1;
  let found = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if ((times[middle] ?? Infinity) <= time) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
}

/**
 * Buy and sell markers of the trades, snapped to candle times: a long
 * opens with a buy and closes with a sell, a short the other way round.
 */
export function tradeMarkers(
  trades: readonly Trade[],
  candleTimes: readonly number[]
): readonly PriceMarker[] {
  const markers: PriceMarker[] = [];
  const add = (time: number | null, action: TradeAction) => {
    if (time === null) return;
    const index = candleIndexAt(candleTimes, time);
    const candleTime = candleTimes[index];
    if (candleTime !== undefined) markers.push({ time: candleTime, action });
  };
  for (const trade of trades) {
    add(trade.entryTime, trade.side === 'long' ? 'buy' : 'sell');
    add(trade.exitTime, trade.side === 'long' ? 'sell' : 'buy');
  }
  return markers
    .sort((left, right) => left.time - right.time)
    .slice(-MAX_PRICE_MARKERS);
}
