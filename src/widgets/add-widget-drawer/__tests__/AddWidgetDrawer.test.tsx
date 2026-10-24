// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useLayoutStore } from '@/entities/layout';
import { useLabStore } from '@/features/lab-state';

import { AddWidgetDrawer } from '../ui/AddWidgetDrawer';

describe('AddWidgetDrawer', () => {
  beforeEach(() => {
    useLayoutStore.getState().resetLayout();
    useLabStore.setState({
      isAddWidgetDrawerOpen: true,
      toast: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders drawer with available widgets', () => {
    render(<AddWidgetDrawer />);

    expect(screen.getByText('Add Widget')).toBeDefined();
    expect(screen.getByText('Monte Carlo 10k Simulator')).toBeDefined();
    expect(screen.getByText('Order Book Heatmap L2')).toBeDefined();
    expect(screen.getByText('Regime-Aware Volatility Filter')).toBeDefined();
  });

  it('adds an inactive widget to layout when clicking Add', () => {
    render(<AddWidgetDrawer />);

    const initialLength = useLayoutStore.getState().layout.length;
    // Find the add button for Monte Carlo
    const monteCarloHeader = screen.getByText('Monte Carlo 10k Simulator');
    const container = monteCarloHeader.closest('.group');
    const addButton = container?.querySelector('button');

    expect(addButton).toBeDefined();
    if (addButton) {
      act(() => {
        fireEvent.click(addButton);
      });
    }

    expect(useLayoutStore.getState().layout.length).toBe(initialLength + 1);
    expect(
      useLayoutStore.getState().layout.some((item) => item.i === 'monte-carlo')
    ).toBe(true);
  });

  it('closes on Escape key press', () => {
    render(<AddWidgetDrawer />);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(useLabStore.getState().isAddWidgetDrawerOpen).toBe(false);
  });
});
