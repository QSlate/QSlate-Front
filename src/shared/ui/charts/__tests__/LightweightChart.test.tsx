// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render as renderUI,
  screen,
} from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useUserStore } from '@/entities/user/model';
import { ThemeSync } from '@/features/theme-sync';

const render = (ui: ReactElement) => renderUI(ui, { wrapper: ThemeSync });

import { ChartSkeleton } from '../ChartSkeleton';
import { LightweightChart } from '../LightweightChart';
import type { LinePointData, OHLCData } from '../types';

const mockSeriesInstance = {
  setData: vi.fn(),
  applyOptions: vi.fn(),
};

const mockTimeScale = {
  fitContent: vi.fn(),
  setVisibleRange: vi.fn(),
  subscribeVisibleTimeRangeChange: vi.fn(),
  unsubscribeVisibleTimeRangeChange: vi.fn(),
};

const mockChartInstance = {
  addSeries: vi.fn(() => mockSeriesInstance),
  subscribeCrosshairMove: vi.fn(),
  unsubscribeCrosshairMove: vi.fn(),
  removeSeries: vi.fn(),
  applyOptions: vi.fn(),
  remove: vi.fn(),
  resize: vi.fn(),
  timeScale: vi.fn(() => mockTimeScale),
};

vi.mock('lightweight-charts', async () => {
  const actual =
    await vi.importActual<typeof import('lightweight-charts')>(
      'lightweight-charts'
    );
  return {
    ...actual,
    createChart: vi.fn(() => mockChartInstance),
  };
});

let mockResizeCallback: ((entries: ResizeObserverEntry[]) => void) | null =
  null;
const mockDisconnect = vi.fn();
const mockObserve = vi.fn();

class MockResizeObserver {
  constructor(callback: (entries: ResizeObserverEntry[]) => void) {
    mockResizeCallback = callback;
  }
  observe = mockObserve;
  unobserve = vi.fn();
  disconnect = mockDisconnect;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockResizeCallback = null;
  useUserStore.getState().resetPreferences();
  global.ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;
});

afterEach(() => {
  cleanup();
});

describe('ChartSkeleton', () => {
  it('renders shimmer skeleton with accessibility status role and aria label', () => {
    render(<ChartSkeleton height={400} />);
    const skeleton = screen.getByTestId('chart-skeleton');
    expect(skeleton).toBeDefined();
    expect(skeleton.getAttribute('role')).toBe('status');
    expect(skeleton.getAttribute('aria-label')).toBe(
      'Loading financial chart visualization'
    );
  });
});

describe('LightweightChart Lifecycle & Memory Management', () => {
  const mockLineData: LinePointData[] = [
    { time: '2026-01-01', value: 100 },
    { time: '2026-01-02', value: 105 },
    { time: '2026-01-03', value: 103 },
  ];

  it('mounts chart and binds series with initial dataset', async () => {
    const { createChart } = await import('lightweight-charts');

    render(
      <LightweightChart
        data={mockLineData}
        seriesType="line"
        ariaLabel="Historical NAV Line Chart"
        height={300}
      />
    );

    expect(createChart).toHaveBeenCalledTimes(1);
    expect(mockChartInstance.addSeries).toHaveBeenCalledTimes(1);
    expect(mockSeriesInstance.setData).toHaveBeenCalledWith(mockLineData);
  });

  it('cleans up and removes chart instance on unmount to prevent memory leaks', () => {
    const { unmount } = render(
      <LightweightChart
        data={mockLineData}
        seriesType="line"
        ariaLabel="Historical NAV Line Chart"
      />
    );

    unmount();

    expect(mockChartInstance.remove).toHaveBeenCalledTimes(1);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('updates series dataset reactively when data prop changes', () => {
    const { rerender } = render(
      <LightweightChart
        data={mockLineData}
        seriesType="line"
        ariaLabel="Historical NAV Line Chart"
      />
    );

    const updatedData: LinePointData[] = [
      ...mockLineData,
      { time: '2026-01-04', value: 110 },
    ];

    rerender(
      <LightweightChart
        data={updatedData}
        seriesType="line"
        ariaLabel="Historical NAV Line Chart"
      />
    );

    expect(mockSeriesInstance.setData).toHaveBeenLastCalledWith(updatedData);
  });

  it('dispatches resize on ResizeObserver trigger via requestAnimationFrame', async () => {
    render(
      <LightweightChart
        data={mockLineData}
        seriesType="line"
        ariaLabel="Resizable Chart"
        autoSize
      />
    );

    expect(mockObserve).toHaveBeenCalledTimes(1);
    expect(mockResizeCallback).toBeDefined();

    mockResizeCallback!([
      {
        contentRect: { width: 800, height: 400 },
      } as unknown as ResizeObserverEntry,
    ]);

    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(mockChartInstance.applyOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 800,
        height: 400,
      })
    );
  });
});

describe('LightweightChart Accessibility (WCAG 2.1 AA)', () => {
  const mockCandleData: OHLCData[] = [
    { time: '2026-06-01', open: 100, high: 110, low: 95, close: 108 },
    { time: '2026-06-02', open: 108, high: 115, low: 105, close: 112 },
  ];

  it('renders semantic accessible data table in sr-only region', () => {
    render(
      <LightweightChart
        data={mockCandleData}
        seriesType="candlestick"
        ariaLabel="Daily Price Candlesticks"
        title="SPY Performance"
      />
    );

    const region = screen.getByTestId('chart-sr-table-region');
    expect(region).toBeDefined();
    expect(region.getAttribute('role')).toBe('region');
    expect(region.getAttribute('aria-label')).toBe('Daily Price Candlesticks');

    expect(screen.getByText('SPY Performance')).toBeDefined();
    expect(screen.getByText('Open')).toBeDefined();
    expect(screen.getByText('High')).toBeDefined();
    expect(screen.getByText('Low')).toBeDefined();
    expect(screen.getByText('Close')).toBeDefined();
    expect(screen.getByText('115')).toBeDefined();
  });
});

describe('LightweightChart Colorblind & Theme Integration', () => {
  const mockLineData: LinePointData[] = [{ time: '2026-01-01', value: 100 }];

  it('applies orange-blue daltonism tokens when colorblind mode is set', () => {
    render(
      <LightweightChart
        data={mockLineData}
        seriesType="line"
        ariaLabel="Colorblind Mode Chart"
        colorblindMode="orange-blue"
      />
    );

    expect(mockSeriesInstance.applyOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        color: '#38BDF8',
      })
    );
  });

  it('reactively updates series colors when store toggles colorblind mode', () => {
    render(
      <LightweightChart
        data={mockLineData}
        seriesType="line"
        ariaLabel="Dynamic Colorblind Chart"
      />
    );

    act(() => {
      useUserStore.getState().toggleColorblindMode();
    });

    expect(mockSeriesInstance.applyOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({
        color: '#38BDF8',
      })
    );
  });
});

describe('Lab comparison and range controls', () => {
  it('adds and removes a benchmark without recreating the primary chart', () => {
    const data = [
      { time: 100, value: 100 },
      { time: 200, value: 110 },
    ];
    const benchmark = [
      { time: 100, value: 100 },
      { time: 200, value: 103 },
    ];
    const { rerender } = render(
      <LightweightChart
        data={data}
        comparisonData={benchmark}
        seriesType="line"
        ariaLabel="Portfolio"
      />
    );
    expect(mockChartInstance.addSeries).toHaveBeenCalledTimes(2);
    expect(mockSeriesInstance.setData).toHaveBeenCalledWith(benchmark);
    rerender(
      <LightweightChart data={data} seriesType="line" ariaLabel="Portfolio" />
    );
    expect(mockChartInstance.removeSeries).toHaveBeenCalledTimes(1);
    expect(mockChartInstance.remove).not.toHaveBeenCalled();
  });

  it('preserves a selected range when the container resizes', async () => {
    const range = { from: 100, to: 200 };
    render(
      <LightweightChart
        data={[
          { time: 100, value: 1 },
          { time: 200, value: 2 },
        ]}
        visibleRange={range}
        seriesType="line"
        ariaLabel="Portfolio"
        options={{ layout: { fontSize: 10 } }}
      />
    );
    expect(mockTimeScale.setVisibleRange).toHaveBeenLastCalledWith(range);
    expect(mockChartInstance.applyOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: expect.objectContaining({
          background: { type: 'solid', color: 'transparent' },
        }),
      })
    );
    mockResizeCallback!([
      { contentRect: { width: 500, height: 250 } } as ResizeObserverEntry,
    ]);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(mockTimeScale.setVisibleRange).toHaveBeenLastCalledWith(range);
  });
});

describe('chart interaction lifecycle', () => {
  it('forwards time range updates and removes subscriptions on unmount', () => {
    const onTimeRangeChange = vi.fn();
    const { unmount } = render(
      <LightweightChart
        data={[{ time: 100, value: 1 }]}
        seriesType="line"
        ariaLabel="Portfolio"
        onTimeRangeChange={onTimeRangeChange}
      />
    );
    const handler =
      mockTimeScale.subscribeVisibleTimeRangeChange.mock.calls[0][0];
    const range = { from: 100, to: 200 };
    act(() => handler(range));
    expect(onTimeRangeChange).toHaveBeenCalledWith(range);
    unmount();
    expect(
      mockTimeScale.unsubscribeVisibleTimeRangeChange
    ).toHaveBeenCalledWith(handler);
    expect(mockChartInstance.unsubscribeCrosshairMove).toHaveBeenCalledTimes(1);
  });

  it('hides stale tooltip values after results change or pointer leaves the chart', () => {
    const initial = [{ time: '2026-01-01', value: 100 }];
    const { rerender } = render(
      <LightweightChart
        data={initial}
        seriesType="line"
        ariaLabel="Portfolio"
      />
    );
    const container = screen.getByTestId('lightweight-chart-container');
    Object.defineProperty(container, 'clientWidth', { value: 500 });
    Object.defineProperty(container, 'clientHeight', { value: 250 });
    const handler = mockChartInstance.subscribeCrosshairMove.mock.calls[0][0];
    const point = {
      time: '2026-01-01',
      point: { x: 20, y: 20 },
      seriesData: new Map([[mockSeriesInstance, { value: 100 }]]),
    };
    act(() => handler(point));
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    act(() => handler({ ...point, point: { x: 501, y: 20 } }));
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    act(() => handler(point));
    fireEvent.pointerLeave(container);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    act(() => handler(point));
    rerender(
      <LightweightChart
        data={[{ time: '2026-01-01', value: 200 }]}
        seriesType="line"
        ariaLabel="Portfolio"
      />
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('reconfigures the resize observer when auto sizing changes', () => {
    const data = [{ time: 100, value: 1 }];
    const { rerender } = render(
      <LightweightChart
        data={data}
        autoSize={false}
        seriesType="line"
        ariaLabel="Portfolio"
      />
    );
    expect(mockObserve).not.toHaveBeenCalled();
    rerender(
      <LightweightChart
        data={data}
        autoSize
        seriesType="line"
        ariaLabel="Portfolio"
      />
    );
    expect(mockObserve).toHaveBeenCalledTimes(1);
    expect(mockChartInstance.remove).toHaveBeenCalledTimes(1);
  });
});
