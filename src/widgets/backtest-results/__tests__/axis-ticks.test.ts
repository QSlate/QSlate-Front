import { describe, expect, it } from 'vitest';

import { niceTicks } from '../model/axis-ticks';

describe('niceTicks', () => {
  it('uses round steps inside the range', () => {
    expect(niceTicks(9_950, 11_840, 4)).toEqual({
      values: [10_000, 10_500, 11_000, 11_500],
      decimals: 0,
    });
  });

  it('adds precision for narrow ranges so labels never repeat', () => {
    const { values, decimals } = niceTicks(9_999.2, 10_000.9, 4);
    expect(decimals).toBe(1);
    const labels = values.map((value) => value.toFixed(decimals));
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('never yields a negative zero on a drawdown axis', () => {
    const { values } = niceTicks(-0.13, 0.01, 4);
    expect(values).toContain(0);
    expect(values.some((value) => Object.is(value, -0))).toBe(false);
    expect(new Set(values).size).toBe(values.length);
  });

  it('handles a flat range', () => {
    expect(niceTicks(5, 5, 4).values).toEqual([5]);
  });
});
