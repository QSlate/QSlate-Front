// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useUserStore } from '@/entities/user/model';

import { ChartSkeleton } from '../ChartSkeleton';
import { LightweightChart } from '../LightweightChart';
import type { LinePointData, OHLCData } from '../types';

const mockSeriesInstance = {
  setData: vi.fn(),
  applyOptions: vi.fn(),
};

const mockTimeScale = {
  fitContent: vi.fn(),
};

const mockChartInstance = {
  addSeries: vi.fn(() => mockSeriesInstance),
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
