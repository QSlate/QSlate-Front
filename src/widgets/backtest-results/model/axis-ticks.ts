export interface AxisTicks {
  readonly values: readonly number[];
  /** Fraction digits needed so that two ticks never print the same label. */
  readonly decimals: number;
}

function niceStep(rough: number): number {
  const exponent = Math.floor(Math.log10(rough));
  const base = 10 ** exponent;
  const fraction = rough / base;
  if (fraction <= 1) return base;
  if (fraction <= 2) return 2 * base;
  if (fraction <= 5) return 5 * base;
  return 10 * base;
}

/**
 * "Nice" ticks (1, 2, 5 × 10ⁿ steps) inside [min, max], at most `count` of
 * them (roughly), with the precision that keeps every label distinct.
 */
export function niceTicks(min: number, max: number, count: number): AxisTicks {
  if (!Number.isFinite(min) || !Number.isFinite(max) || count < 1) {
    return { values: [], decimals: 0 };
  }
  if (max <= min) return { values: [min], decimals: 0 };
  const step = niceStep((max - min) / count);
  const first = Math.ceil(min / step) * step;
  const decimals = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  const factor = 10 ** decimals;
  const values: number[] = [];
  for (let value = first; value <= max + step * 1e-9; value += step) {
    // Snap away float noise and the "-0" that would print as "-0 %".
    const rounded = Math.round(value * factor) / factor;
    values.push(Object.is(rounded, -0) ? 0 : rounded);
  }
  return { values: [...new Set(values)], decimals };
}
