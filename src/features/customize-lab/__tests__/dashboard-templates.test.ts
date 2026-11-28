import { describe, expect, it } from 'vitest';

import { findLabWidget } from '@/entities/widget';

import { GRID_COLUMNS } from '../model/dashboard-layout';
import {
  DASHBOARD_TEMPLATES,
  DEFAULT_DASHBOARD_TEMPLATE,
  templateLayout,
} from '../model/dashboard-templates';

describe('dashboard templates', () => {
  it('offers the four starting points, essential first', () => {
    expect(DASHBOARD_TEMPLATES.map((template) => template.id)).toEqual([
      'essential',
      'complete',
      'trades',
      'empty',
    ]);
    expect(DEFAULT_DASHBOARD_TEMPLATE).toBe('essential');
  });

  it('places each widget once, inside the grid and above its minimum size', () => {
    for (const template of DASHBOARD_TEMPLATES) {
      const types = template.layout.map((item) => item.i);
      expect(new Set(types).size).toBe(types.length);
      for (const item of template.layout) {
        const widget = findLabWidget(item.i);
        expect(widget).toBeDefined();
        expect(item.x + item.w).toBeLessThanOrEqual(GRID_COLUMNS);
        expect(item.w).toBeGreaterThanOrEqual(widget?.minSize.w ?? 0);
        expect(item.h).toBeGreaterThanOrEqual(widget?.minSize.h ?? 0);
      }
    }
  });

  it('keeps every widget in the complete template and none in the empty one', () => {
    expect(templateLayout('complete')).toHaveLength(10);
    expect(templateLayout('empty')).toEqual([]);
  });

  it('builds the essential template from its five widgets', () => {
    expect(templateLayout('essential').map((item) => item.i)).toEqual([
      'net-return',
      'max-drawdown',
      'win-rate',
      'capital-chart',
      'price-chart',
    ]);
  });
});
