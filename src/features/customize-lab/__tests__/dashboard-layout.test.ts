import { describe, expect, it } from 'vitest';

import {
  addDashboardWidget,
  availableWidgets,
  DEFAULT_DASHBOARD_LAYOUT,
  moveDashboardWidget,
  removeDashboardWidget,
  resizeDashboardWidget,
  sanitizeDashboardLayout,
} from '../model/dashboard-layout';

describe('dashboard layout', () => {
  it('places every widget once by default without overlaps', () => {
    expect(DEFAULT_DASHBOARD_LAYOUT).toHaveLength(9);
    expect(availableWidgets(DEFAULT_DASHBOARD_LAYOUT)).toEqual([]);
  });

  it('drops unknown, duplicate and malformed stored items', () => {
    const layout = sanitizeDashboardLayout([
      { i: 'sharpe', x: 0, y: 0, w: 3, h: 3 },
      { i: 'sharpe', x: 3, y: 0, w: 3, h: 3 },
      { i: 'monte-carlo', x: 0, y: 3, w: 4, h: 4 },
      { i: 'trades', x: 'a', y: 0, w: 1, h: 1 },
    ]);
    expect(layout?.map((item) => item.i)).toEqual(['sharpe']);
    expect(sanitizeDashboardLayout('nope')).toBeNull();
  });

  it('enforces minimum sizes when resizing', () => {
    const layout = [{ i: 'trades' as const, x: 0, y: 0, w: 12, h: 7 }];
    const smaller = resizeDashboardWidget(layout, 'trades', -10, -10);
    expect(smaller[0]).toMatchObject({ w: 6, h: 4 });
  });

  it('adds below, removes and moves by keyboard', () => {
    const one = addDashboardWidget([], 'sharpe');
    const two = addDashboardWidget(one, 'win-rate');
    expect(two.find((item) => item.i === 'win-rate')).toMatchObject({
      x: 0,
      y: 3,
    });
    expect(addDashboardWidget(two, 'sharpe')).toBe(two);
    const moved = moveDashboardWidget(two, 'win-rate', 4, -3);
    expect(moved.find((item) => item.i === 'win-rate')?.x).toBe(4);
    expect(
      removeDashboardWidget(moved, 'sharpe').map((item) => item.i)
    ).toEqual(['win-rate']);
  });
});
