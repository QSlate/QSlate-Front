import type { StrategyParameterValue } from '@/entities/backtest';

import type { ParameterField } from './strategy-parameters';

/**
 * Warm-up candles read before the first signal. The backend default (20)
 * is shorter than most indicator periods, so strategies would never trade.
 */
export const DEFAULT_WARMUP_WINDOW = 200;

export interface WarmupShortfall {
  /** Human label of the longest period parameter ("Slow period"). */
  readonly parameter: string;
  /** Its value: the warm-up the run needs at least. */
  readonly period: number;
}

/**
 * The longest integer "period" parameter when it exceeds the warm-up
 * window (its indicator would never be ready), otherwise null.
 */
export function warmupShortfall(
  window: number | null,
  fields: readonly ParameterField[],
  overrides: Readonly<Record<string, StrategyParameterValue>>
): WarmupShortfall | null {
  if (window === null) return null;
  let longest: WarmupShortfall | null = null;
  for (const field of fields) {
    if (field.kind !== 'number' || !/period/iu.test(field.key)) continue;
    const value = overrides[field.key] ?? field.defaultValue;
    if (typeof value !== 'number' || !Number.isInteger(value)) continue;
    if (value > window && (longest === null || value > longest.period)) {
      longest = { parameter: field.label, period: value };
    }
  }
  return longest;
}
