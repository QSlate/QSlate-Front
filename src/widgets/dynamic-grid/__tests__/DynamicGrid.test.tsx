// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
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
      <WidgetContainer id="mini-ide" title="Mini IDE" layout={mockLayout}>
        <div>Content</div>
      </WidgetContainer>
    );

    const pinBtn = screen.getByTestId('widget-pin-btn');
    fireEvent.click(pinBtn);

    expect(
      useLayoutStore.getState().layout.find((item) => item.i === 'mini-ide')
        ?.isPinned
    ).toBe(true);
  });

  it('invokes toggleWidgetMinimize when minimize button is clicked', () => {
    render(
      <WidgetContainer id="mini-ide" title="Mini IDE" layout={mockLayout}>
        <div>Content</div>
      </WidgetContainer>
    );

    const minimizeBtn = screen.getByTestId('widget-minimize-btn');
    fireEvent.click(minimizeBtn);

    expect(
      useLayoutStore.getState().layout.find((item) => item.i === 'mini-ide')
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
                  i: 'mini-ide',
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
    const miniIde = storeState.layout.find((item) => item.i === 'mini-ide');

    expect(miniIde?.x).toBe(3);
    expect(miniIde?.y).toBe(4);
    expect(onCommit).toHaveBeenCalled();
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
});
