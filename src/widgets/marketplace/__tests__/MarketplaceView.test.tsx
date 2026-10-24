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

import { MarketplaceView } from '../ui/MarketplaceView';

describe('MarketplaceView', () => {
  beforeEach(() => {
    useLayoutStore.getState().resetLayout();
    useLabStore.setState({
      marketplaceSearch: '',
      marketplaceCategory: 'All',
      toast: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders marketplace modules catalog', () => {
    render(<MarketplaceView />);

    expect(screen.getByText('Widget Marketplace')).toBeDefined();
    expect(screen.getByText('Monte Carlo 10k Simulator')).toBeDefined();
    expect(screen.getByText('Order Book Heatmap L2')).toBeDefined();
    expect(screen.getByText('Regime-Aware Volatility Filter')).toBeDefined();
    expect(screen.getByText('TWAP/VWAP Execution Engine')).toBeDefined();
  });

  it('filters modules by search query', () => {
    render(<MarketplaceView />);

    const searchInput = screen.getByPlaceholderText(
      'Search modules, authors, signals...'
    );
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'Monte Carlo' } });
    });

    expect(screen.getByText('Monte Carlo 10k Simulator')).toBeDefined();
    expect(screen.queryByText('Order Book Heatmap L2')).toBeNull();
  });

  it('installs a module to the Lab Workspace on button click', () => {
    render(<MarketplaceView />);

    const initialCount = useLayoutStore.getState().layout.length;
    // Find the Install to Lab button for Monte Carlo
    const installButtons = screen.getAllByText('Install to Lab');
    expect(installButtons.length).toBeGreaterThan(0);

    act(() => {
      fireEvent.click(installButtons[0]!);
    });

    expect(useLayoutStore.getState().layout.length).toBe(initialCount + 1);
  });
});
