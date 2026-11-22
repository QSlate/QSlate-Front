import { describe, expect, it } from 'vitest';

import type { Trade } from '@/entities/backtest';

import { tradeMarkers } from '../model/price-markers';

const TRADE: Trade = {
  id: 't',
  side: 'long',
  entryTime: 3_700,
  exitTime: 7_300,
  entryPrice: 1,
  exitPrice: 2,
  sizeUsd: 1,
  pnlUsd: 1,
  pnlPct: 1,
  feeUsd: 0,
  exitReason: null,
};

describe('tradeMarkers', () => {
  const times = [0, 3_600, 7_200, 10_800];

  it('snaps long entries to buys and exits to sells on their candle', () => {
    expect(tradeMarkers([TRADE], times)).toEqual([
      { time: 3_600, action: 'buy' },
      { time: 7_200, action: 'sell' },
    ]);
  });

  it('reverses the actions of a short and skips open exits', () => {
    expect(
      tradeMarkers([{ ...TRADE, side: 'short', exitTime: null }], times)
    ).toEqual([{ time: 3_600, action: 'sell' }]);
  });

  it('drops orders placed before the first candle', () => {
    expect(
      tradeMarkers([{ ...TRADE, entryTime: -5, exitTime: null }], times)
    ).toEqual([]);
  });
});
