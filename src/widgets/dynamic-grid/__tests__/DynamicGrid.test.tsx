// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import type { Layout } from 'react-grid-layout';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLayoutStore, type WidgetLayout } from '@/entities/layout/model';
import { WidgetContainer } from '@/entities/layout/ui/WidgetContainer';

import { useGridSync } from '../model/useGridSync';
import type { WidgetDefinition } from '../types';
import { DynamicGrid } from '../ui/DynamicGrid';
import { GridSkeleton } from '../ui/GridSkeleton';

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeEach(() => {
  useLayoutStore.getState().resetLayout();
  global.ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    value: 1200,
  });
});

afterEach(() => {
  cleanup();
});

describe('GridSkeleton', () => {
  it('renders skeleton loading elements with appropriate accessible label', () => {
    render(<GridSkeleton />);
    const skeleton = screen.getByTestId('grid-skeleton');
    expect(skeleton).toBeDefined();
    expect(skeleton.getAttribute('aria-label')).toBe(
      'Loading workspace grid layout'
    );
  });
});

describe('WidgetContainer', () => {
  const mockLayout: WidgetLayout = {
    i: 'test-widget',
    x: 0,
    y: 0,
    w: 4,
    h: 4,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  };

  it('renders header, title, drag handle and children content', () => {
    render(
      <WidgetContainer id="test-widget" title="Test Title" layout={mockLayout}>
        <div data-testid="child-content">Child Widget Content</div>
      </WidgetContainer>
    );

    expect(screen.getByText('Test Title')).toBeDefined();
    expect(screen.getByTestId('widget-drag-handle')).toBeDefined();
    expect(screen.getByTestId('child-content')).toBeDefined();
  });

  it('keeps the injected resize handle directly inside the grid item', () => {
    const { container } = render(
      <WidgetContainer
        id="test-widget"
        title="Resizable"
        layout={mockLayout}
        widgetContent={<div>Content</div>}
      >
        <span className="react-resizable-handle react-resizable-handle-se" />
      </WidgetContainer>
    );
    expect(
      container.querySelector('.lab-widget > .react-resizable-handle')
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[data-testid="widget-content"] .react-resizable-handle'
      )
    ).toBeNull();
  });

  it('hides content slot when widget is minimized', () => {
    const minimizedLayout: WidgetLayout = {
      ...mockLayout,
      isMinimized: true,
    };

    render(
      <WidgetContainer
        id="test-widget"
        title="Test Title"
        layout={minimizedLayout}
      >
        <div data-testid="child-content">Child Widget Content</div>
      </WidgetContainer>
    );

    expect(screen.queryByTestId('widget-content')).toBeNull();
  });

  it('shows pinned badge when widget is pinned', () => {
    const pinnedLayout: WidgetLayout = {
      ...mockLayout,
      isPinned: true,
    };

    render(
      <WidgetContainer
        id="test-widget"
        title="Test Title"
        layout={pinnedLayout}
      >
        <div>Content</div>
      </WidgetContainer>
    );

    expect(screen.getByText('Pinned')).toBeDefined();
  });

  it('invokes toggleWidgetPin when pin button is clicked', () => {
    render(
      <WidgetContainer id="equity-curve" title="Mini IDE" layout={mockLayout}>
        <div>Content</div>
      </WidgetContainer>
    );

    const pinBtn = screen.getByTestId('widget-pin-btn');
    fireEvent.click(pinBtn);

    expect(
      useLayoutStore.getState().layout.find((item) => item.i === 'equity-curve')
        ?.isPinned
    ).toBe(true);
  });

  it('invokes toggleWidgetMinimize when minimize button is clicked', () => {
    render(
      <WidgetContainer id="equity-curve" title="Mini IDE" layout={mockLayout}>
        <div>Content</div>
      </WidgetContainer>
    );

    const minimizeBtn = screen.getByTestId('widget-minimize-btn');
    fireEvent.click(minimizeBtn);

    expect(
      useLayoutStore.getState().layout.find((item) => item.i === 'equity-curve')
        ?.isMinimized
    ).toBe(true);
  });

  it('invokes onRemove callback when remove button is clicked', () => {
    const onRemoveMock = vi.fn();
    render(
      <WidgetContainer
        id="test-widget"
        title="Test Title"
        layout={mockLayout}
        onRemove={onRemoveMock}
      >
        <div>Content</div>
      </WidgetContainer>
    );

    const removeBtn = screen.getByTestId('widget-remove-btn');
    fireEvent.click(removeBtn);

    expect(onRemoveMock).toHaveBeenCalledWith('test-widget');
  });
});

describe('useGridSync', () => {
  function drag(sync: ReturnType<typeof useGridSync>, layout: Layout) {
    sync.handleDragStop(
      layout,
      null,
      null,
      null,
      new MouseEvent('mouseup'),
      document.createElement('div')
    );
  }

  function TestHookConsumer({
    onCommit,
  }: {
    onCommit?: (layouts: WidgetLayout[]) => void;
  }) {
    const sync = useGridSync({ onLayoutCommit: onCommit });
    return (
      <div>
        <button
          type="button"
          data-testid="simulate-drag"
          onClick={() => {
            sync.handleDragStop(
              [
                {
                  i: 'equity-curve',
                  x: 3,
                  y: 4,
                  w: 8,
                  h: 6,
                },
              ],
              null,
              null,
              null,
              new MouseEvent('mouseup'),
              document.createElement('div')
            );
          }}
        >
          Simulate Drag
        </button>
      </div>
    );
  }

  it('synchronizes drag-stop layout mutations into useLayoutStore', () => {
    const onCommit = vi.fn();
    render(<TestHookConsumer onCommit={onCommit} />);

    const button = screen.getByTestId('simulate-drag');
    act(() => {
      fireEvent.click(button);
    });

    const storeState = useLayoutStore.getState();
    const miniIde = storeState.layout.find((item) => item.i === 'equity-curve');

    expect(miniIde?.x).toBe(3);
    expect(miniIde?.y).toBe(4);
    expect(onCommit).toHaveBeenCalled();
  });

  it('preserves widgets outside a grid when committing a visible subset', () => {
    const { result } = renderHook(() =>
      useGridSync({
        widgets: {
          'equity-curve': {
            id: 'equity-curve',
            title: 'Equity',
            component: () => null,
          },
        },
      })
    );

    act(() => {
      drag(result.current, [{ i: 'equity-curve', x: 1, y: 2, w: 7, h: 8 }]);
    });

    expect(useLayoutStore.getState().layout).toHaveLength(4);
    expect(useLayoutStore.getState().layout[1]?.i).toBe('drawdown');
    expect(useLayoutStore.getState().layout[0]).toMatchObject({ x: 1, y: 2 });
  });

  it('retains the full height and constraints when dragging minimized widgets', () => {
    useLayoutStore.getState().toggleWidgetMinimize('equity-curve');
    const { result } = renderHook(() => useGridSync());

    act(() => {
      drag(result.current, [{ i: 'equity-curve', x: 0, y: 3, w: 8, h: 1 }]);
    });

    expect(useLayoutStore.getState().layout[0]).toMatchObject({
      h: 7,
      minH: 4,
      isMinimized: true,
      y: 3,
    });

    act(() => useLayoutStore.getState().toggleWidgetMinimize('equity-curve'));
    expect(result.current.rglLayout[0]).toMatchObject({ h: 7, minH: 4 });
  });

  it('stacks mobile widgets by their actual heights and desktop reading order', () => {
    useLayoutStore.getState().updateWidget('equity-curve', { h: 15, y: 20 });
    useLayoutStore.getState().toggleWidgetMinimize('execution-metrics');
    const { result } = renderHook(() => useGridSync({ rowHeight: 36 }));
    const mobileLayout = result.current.rglLayouts.sm!;

    expect(mobileLayout.map((item) => item.i)).toEqual([
      'drawdown',
      'execution-metrics',
      'trade-log',
      'equity-curve',
    ]);
    for (let index = 1; index < mobileLayout.length; index += 1) {
      const previous = mobileLayout[index - 1]!;
      expect(mobileLayout[index]!.y).toBe(previous.y + previous.h);
    }
    expect(mobileLayout.every((item) => item.w === 1 && item.minW === 1)).toBe(
      true
    );
    expect(mobileLayout[1]!.h).toBe(2);
  });

  it('keeps mobile adjustments from replacing the saved desktop layout', () => {
    const before = useLayoutStore.getState().layout;
    const onLayoutCommit = vi.fn();
    const { result } = renderHook(() => useGridSync({ onLayoutCommit }));

    act(() => result.current.handleBreakpointChange('sm', 1));
    act(() =>
      drag(result.current, [{ i: 'equity-curve', x: 0, y: 0, w: 1, h: 7 }])
    );

    expect(useLayoutStore.getState().layout).toBe(before);
    expect(onLayoutCommit).not.toHaveBeenCalled();
  });

  it('ignores geometry changes in read-only grids and on pinned widgets', () => {
    const before = useLayoutStore.getState().layout;
    const { result: readOnly } = renderHook(() =>
      useGridSync({ isEditable: false })
    );
    act(() =>
      drag(readOnly.current, [{ i: 'equity-curve', x: 2, y: 3, w: 6, h: 5 }])
    );
    expect(useLayoutStore.getState().layout).toBe(before);

    act(() => useLayoutStore.getState().toggleWidgetPin('equity-curve'));
    const { result: editable } = renderHook(() => useGridSync());
    act(() =>
      drag(editable.current, [{ i: 'equity-curve', x: 2, y: 3, w: 6, h: 5 }])
    );
    expect(useLayoutStore.getState().layout[0]).toMatchObject({
      x: 0,
      y: 0,
      w: 8,
      h: 7,
      isPinned: true,
    });
  });

  it('does not rewrite storage or notify consumers for unchanged geometry', () => {
    const before = useLayoutStore.getState().layout;
    const onLayoutCommit = vi.fn();
    const { result } = renderHook(() => useGridSync({ onLayoutCommit }));

    act(() => drag(result.current, before));

    expect(useLayoutStore.getState().layout).toBe(before);
    expect(onLayoutCommit).not.toHaveBeenCalled();
  });

  it('does not reopen a widget closed before a stale drag callback finishes', () => {
    const { result } = renderHook(() => useGridSync());
    const staleSync = result.current;

    act(() => useLayoutStore.getState().removeWidget('equity-curve'));
    act(() => drag(staleSync, [{ i: 'equity-curve', x: 1, y: 2, w: 6, h: 5 }]));

    expect(useLayoutStore.getState().layout).toHaveLength(3);
    expect(
      useLayoutStore.getState().layout.some((item) => item.i === 'equity-curve')
    ).toBe(false);
  });
});

describe('DynamicGrid', () => {
  const customWidgets: Record<string, WidgetDefinition> = {
    'custom-1': {
      id: 'custom-1',
      title: 'Custom Alpha Widget',
      component: () => <div data-testid="custom-1-content">Alpha Content</div>,
      defaultLayout: { x: 0, y: 0, w: 6, h: 4 },
    },
  };

  it('renders dynamic grid container and widgets', () => {
    render(<DynamicGrid widgets={customWidgets} />);
    expect(screen.getByTestId('dynamic-grid-container')).toBeDefined();
    expect(screen.getByText('Custom Alpha Widget')).toBeDefined();
    expect(screen.getByTestId('custom-1-content')).toBeDefined();
  });

  it('renders default widgets when widgets prop is omitted', () => {
    render(<DynamicGrid />);
    expect(screen.getByTestId('dynamic-grid-container')).toBeDefined();
    expect(screen.getByText('Strategy IDE · Python')).toBeDefined();
  });

  it('uses custom widget flags for both its container and grid constraints', () => {
    render(
      <DynamicGrid
        widgets={{
          'custom-1': {
            ...customWidgets['custom-1']!,
            defaultLayout: { x: 0, y: 0, w: 6, h: 4, isMinimized: true },
          },
        }}
      />
    );

    expect(screen.queryByTestId('custom-1-content')).toBeNull();
    expect(
      screen.getByTestId('widget-minimize-btn').getAttribute('aria-expanded')
    ).toBe('false');
  });
});
