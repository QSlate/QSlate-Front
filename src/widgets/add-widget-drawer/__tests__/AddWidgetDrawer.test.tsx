// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLayoutStore } from '@/entities/layout';
import { useLabStore } from '@/features/lab-state';
import { apiClient } from '@/shared/api';
import { AppearanceProvider } from '@/shared/theme';

import { AddWidgetDrawer } from '../ui/AddWidgetDrawer';

describe('AddWidgetDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLayoutStore.getState().resetLayout();
    useLabStore.setState({
      isAddWidgetDrawerOpen: true,
      toast: null,
    });

    vi.spyOn(apiClient, 'getInstalledWidgets').mockResolvedValue({
      items: [
        {
          id: 'custom-delta-neutral',
          version_id: 'ver-cdn-1',
          kind: 'custom',
          name: 'Delta Neutral Strategy Monitor',
          language: 'python',
          category: 'Custom',
          subtitle: 'Real-time delta gamma vega exposure monitor',
          default_w: 6,
          default_h: 4,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders drawer with available core and dynamic backend widgets', async () => {
    render(<AddWidgetDrawer />);

    expect(screen.getByText('Add Widget')).toBeDefined();

    // Verify dynamic widget and core widgets loaded from API
    await waitFor(() => {
      expect(screen.getByText('Monte Carlo 10k Simulator')).toBeDefined();
      expect(screen.getByText('Order Book Heatmap L2')).toBeDefined();
      expect(screen.getByText('Delta Neutral Strategy Monitor')).toBeDefined();
      expect(screen.getByText('custom')).toBeDefined();
    });
  });

  it('filters widgets by search input', async () => {
    render(<AddWidgetDrawer />);

    await waitFor(() => {
      expect(screen.getByText('Delta Neutral Strategy Monitor')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText(
      'Search modules, indicators, algos...'
    );

    act(() => {
      fireEvent.change(searchInput, { target: { value: 'Delta Neutral' } });
    });

    expect(screen.getByText('Delta Neutral Strategy Monitor')).toBeDefined();
    expect(screen.queryByText('Monte Carlo 10k Simulator')).toBeNull();
  });

  it('filters widgets by category pill click', async () => {
    render(<AddWidgetDrawer />);

    await waitFor(() => {
      expect(screen.getByText('Delta Neutral Strategy Monitor')).toBeDefined();
    });

    const customPill = screen.getByRole('button', { name: 'Custom' });
    act(() => {
      fireEvent.click(customPill);
    });

    expect(screen.getByText('Delta Neutral Strategy Monitor')).toBeDefined();
    expect(screen.queryByText('Monte Carlo 10k Simulator')).toBeNull();
  });

  it('adds a dynamic custom widget to layout when clicking Add', async () => {
    render(<AddWidgetDrawer />);

    await waitFor(() => {
      expect(screen.getByText('Delta Neutral Strategy Monitor')).toBeDefined();
    });

    const initialLength = useLayoutStore.getState().layout.length;
    const dynamicHeader = screen.getByText('Delta Neutral Strategy Monitor');
    const container = dynamicHeader.closest('.group');
    const addButton = container?.querySelector('button');

    expect(addButton).toBeDefined();
    if (addButton) {
      act(() => {
        fireEvent.click(addButton);
      });
    }

    expect(useLayoutStore.getState().layout.length).toBe(initialLength + 1);
    expect(
      useLayoutStore
        .getState()
        .layout.some((item) => item.i === 'custom-delta-neutral')
    ).toBe(true);
    expect(useLabStore.getState().toast?.type).toBe('success');
  });

  it('removes an active widget from layout when clicking Remove', async () => {
    // Add Monte Carlo first
    useLayoutStore.getState().addWidget('monte-carlo');

    render(<AddWidgetDrawer />);

    await waitFor(() => {
      expect(screen.getByText('Monte Carlo 10k Simulator')).toBeDefined();
    });

    const monteCarloHeader = screen.getByText('Monte Carlo 10k Simulator');
    const container = monteCarloHeader.closest('.group');
    const removeButton = container?.querySelector('button');

    expect(removeButton).toBeDefined();
    if (removeButton) {
      act(() => {
        fireEvent.click(removeButton);
      });
    }

    expect(
      useLayoutStore.getState().layout.some((item) => item.i === 'monte-carlo')
    ).toBe(false);
    expect(useLabStore.getState().toast?.type).toBe('info');
  });

  it('closes on Escape key press', () => {
    render(<AddWidgetDrawer />);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(useLabStore.getState().isAddWidgetDrawerOpen).toBe(false);
  });

  it('renders correctly in light theme mode', async () => {
    render(
      <AppearanceProvider value={{ theme: 'light', colorblindMode: 'none' }}>
        <AddWidgetDrawer />
      </AppearanceProvider>
    );

    expect(screen.getByText('Add Widget')).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText('Delta Neutral Strategy Monitor')).toBeDefined();
    });
  });
});
