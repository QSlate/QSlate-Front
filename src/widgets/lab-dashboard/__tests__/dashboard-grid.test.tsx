// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type { LabWidgetType } from '@/entities/widget';
import { DEFAULT_DASHBOARD_LAYOUT } from '@/features/customize-lab';

import type { WidgetComponents } from '../model/types';
import { DashboardGrid, renderResizeCorner } from '../ui/dashboard-grid';

function Empty() {
  return null;
}

const COMPONENTS: WidgetComponents = {
  'net-return': Empty,
  'max-drawdown': Empty,
  sharpe: Empty,
  'win-rate': Empty,
  'capital-chart': Empty,
  drawdowns: Empty,
  'monthly-returns': Empty,
  'trade-distribution': Empty,
  trades: Empty,
};

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  // jsdom has no layout: give the grid a desktop width.
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => 1200,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('renderResizeCorner', () => {
  it('attaches react-resizable ref and axis class to the DOM handle', () => {
    const ref = createRef<HTMLElement>();
    render(<div>{renderResizeCorner('se', ref)}</div>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(ref.current?.className).toContain('react-resizable-handle-se');
  });
});

describe('DashboardGrid', () => {
  it('renders one live resize handle per widget while editing', async () => {
    const { container } = render(
      <DashboardGrid
        layout={DEFAULT_DASHBOARD_LAYOUT}
        editing
        components={COMPONENTS}
        onChange={vi.fn()}
        onRemove={vi.fn<(type: LabWidgetType) => void>()}
      />
    );
    await waitFor(() =>
      expect(
        container.querySelectorAll('.react-resizable-handle-se')
      ).toHaveLength(DEFAULT_DASHBOARD_LAYOUT.length)
    );
  });
});
