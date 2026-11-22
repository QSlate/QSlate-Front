import { describe, expect, it } from 'vitest';

import {
  buildSearchSpace,
  gridSize,
  rangeValues,
  validateOptimization,
} from '../model/search-space';

describe('search space', () => {
  it('spreads values evenly, rounding integers', () => {
    expect(
      rangeValues({ key: 'p', min: 10, max: 20, steps: 3, integer: true })
    ).toEqual([10, 15, 20]);
    expect(
      rangeValues({ key: 'p', min: 1, max: 2, steps: 5, integer: true })
    ).toEqual([1, 2]);
    expect(
      rangeValues({ key: 'p', min: 0.5, max: 1.5, steps: 3, integer: false })
    ).toEqual([0.5, 1, 1.5]);
  });

  it('counts grid combinations and enforces the trial cap', () => {
    const ranges = [
      { key: 'a', min: 1, max: 3, steps: 3, integer: true },
      { key: 'b', min: 1, max: 4, steps: 4, integer: true },
    ];
    expect(gridSize(buildSearchSpace(ranges))).toBe(12);
    expect(validateOptimization('grid_search', ranges, 10)).toMatch(
      /12 combinaisons/
    );
    expect(validateOptimization('monte_carlo', ranges, 10)).toBeNull();
    expect(validateOptimization('monte_carlo', ranges, 40)).toMatch(
      /Entre 1 et 25/
    );
    expect(validateOptimization('grid_search', [], 5)).toMatch(/au moins un/);
  });
});
