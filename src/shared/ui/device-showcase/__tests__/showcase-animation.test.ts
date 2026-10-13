import { describe, expect, it } from 'vitest';

import { getShowcaseFrame } from '../showcase-animation';

describe('showcase scroll animation', () => {
  it('reaches the final pose immediately after a full-page scroll jump', () => {
    getShowcaseFrame(0);
    const frame = getShowcaseFrame(1);
    expect(frame.open).toBe(1);
    expect(frame.brightness).toBe(1);
    expect(frame.y).toBeCloseTo(-0.06);
  });

  it('returns to the same pose after rapid direction changes', () => {
    const original = getShowcaseFrame(0.35);
    for (const progress of [1, 0, 0.8, 0.1]) getShowcaseFrame(progress);
    expect(getShowcaseFrame(0.35)).toEqual(original);
    expect(getShowcaseFrame(0)).toEqual({ open: 0, brightness: 0, y: 0.12 });
  });

  it('holds the open pose before the sticky section releases', () => {
    expect(getShowcaseFrame(0.64)).toEqual(getShowcaseFrame(1));
  });

  it('clamps overscroll and keeps screen brightness within bounds', () => {
    expect(getShowcaseFrame(-0.5)).toEqual(getShowcaseFrame(0));
    expect(getShowcaseFrame(1.5)).toEqual(getShowcaseFrame(1));
    let previousOpen = 0;
    for (let step = 0; step <= 100; step++) {
      const { open, brightness } = getShowcaseFrame(step / 100);
      expect(open).toBeGreaterThanOrEqual(previousOpen);
      expect(open).toBeLessThanOrEqual(1);
      expect(brightness).toBeGreaterThanOrEqual(0);
      expect(brightness).toBeLessThanOrEqual(1);
      previousOpen = open;
    }
  });
});
