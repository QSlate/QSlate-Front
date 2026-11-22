/**
 * The UI edits the trading fee as a percentage of each trade ("0,10 %"),
 * while the lab service expects `commission_rate` as a fraction of the
 * notional (fee = size × rate, so 0.10 % → 0.001).
 */
export function commissionPercentToRate(percent: number): number {
  return Number((percent / 100).toFixed(8));
}

export function commissionRateToPercent(rate: number): number {
  return Number((rate * 100).toFixed(6));
}
