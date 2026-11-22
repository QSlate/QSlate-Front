// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/entities/user/model';
import { useLabStore } from '@/features/lab-state';
import { apiClient } from '@/shared/api';
import { AppearanceProvider } from '@/shared/theme';

import {
  calculateTotalPermutations,
  generateParameterValues,
} from '../model/types';
import { StrategyOptimizationModal } from '../ui/StrategyOptimizationModal';

const mockBacktest = {
  status: 'idle',
  run: vi.fn(),
  error: null,
  result: null,
};

vi.mock('@/features/run-backtest/BacktestProvider', () => ({
  useBacktest: () => mockBacktest,
}));

describe('Strategy Parameter Optimization & Grid Search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLabStore.setState({
      isOptimizationModalOpen: true,
      strategyName: 'Trend Following Dual MA',
      strategyId: 'strat-123',
      versionId: 'ver-456',
      activeStrategyParameters: {},
      toast: null,
    });

    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: 'test-token',
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Mathematical Helper Functions', () => {
    it('generates correct float sequences with step', () => {
      const vals = generateParameterValues(10, 20, 5);
      expect(vals).toEqual([10, 15, 20]);

      const floatVals = generateParameterValues(0.1, 0.3, 0.1);
      expect(floatVals).toEqual([0.1, 0.2, 0.3]);
    });

    it('calculates total Cartesian permutations', () => {
      const params = [
        { id: '1', name: 'fast', min: 10, max: 20, step: 5 }, // 3
        { id: '2', name: 'slow', min: 30, max: 50, step: 10 }, // 3
      ];
      expect(calculateTotalPermutations(params)).toBe(9);
    });
  });

  describe('Modal Rendering and Dismissal', () => {
    it('does not render when closed in store', () => {
      useLabStore.setState({ isOptimizationModalOpen: false });
      render(
        <AppearanceProvider value={{ theme: 'dark', colorblindMode: 'none' }}>
          <StrategyOptimizationModal />
        </AppearanceProvider>
      );
      expect(
        screen.queryByText(/Strategy Parameter Optimization & Grid Search/i)
      ).toBeNull();
    });

    it('renders modal with strategy information when open', () => {
      render(
        <AppearanceProvider value={{ theme: 'dark', colorblindMode: 'none' }}>
          <StrategyOptimizationModal />
        </AppearanceProvider>
      );
      expect(
        screen.getByRole('heading', {
          name: /Strategy Parameter Optimization & Grid Search/i,
        })
      ).toBeDefined();
      expect(screen.getByText(/Trend Following Dual MA/i)).toBeDefined();
    });

    it('closes modal on Escape key press', () => {
      render(
        <AppearanceProvider value={{ theme: 'dark', colorblindMode: 'none' }}>
          <StrategyOptimizationModal />
        </AppearanceProvider>
      );
      expect(useLabStore.getState().isOptimizationModalOpen).toBe(true);

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(useLabStore.getState().isOptimizationModalOpen).toBe(false);
    });

    it('closes modal on close button click', () => {
      render(
        <AppearanceProvider value={{ theme: 'dark', colorblindMode: 'none' }}>
          <StrategyOptimizationModal />
        </AppearanceProvider>
      );
      const closeBtn = screen.getByRole('button', { name: /^Close$/i });
      fireEvent.click(closeBtn);
      expect(useLabStore.getState().isOptimizationModalOpen).toBe(false);
    });
  });

  describe('Search Space & Quota Verification', () => {
    it('computes initial permutations badge correctly', () => {
      render(
        <AppearanceProvider value={{ theme: 'dark', colorblindMode: 'none' }}>
          <StrategyOptimizationModal />
        </AppearanceProvider>
      );
      // fast_period: 10..20 step 5 (3 values) * slow_period: 30..50 step 10 (3 values) = 9 trials
      expect(screen.getByText('9 trials')).toBeDefined();
    });

    it('allows adding and removing parameters', () => {
      render(
        <AppearanceProvider value={{ theme: 'dark', colorblindMode: 'none' }}>
          <StrategyOptimizationModal />
        </AppearanceProvider>
      );

      const addBtn = screen.getByRole('button', { name: /Add Parameter/i });
      fireEvent.click(addBtn);

      expect(screen.getByDisplayValue('param_3')).toBeDefined();

      const removeButtons = screen.getAllByRole('button', {
        name: /Remove parameter/i,
      });
      fireEvent.click(removeButtons[removeButtons.length - 1]!);

      expect(screen.queryByDisplayValue('param_3')).toBeNull();
    });

    it('displays warning alert and disables launch when permutations exceed 25 in grid search', () => {
      render(
        <AppearanceProvider value={{ theme: 'dark', colorblindMode: 'none' }}>
          <StrategyOptimizationModal />
        </AppearanceProvider>
      );

      // Change fast_period step to 1 to produce 11 values, making total 33 trials
      const stepInput = screen.getByLabelText(/Step for fast_period/i);
      fireEvent.change(stepInput, { target: { value: '1' } });

      expect(screen.getByRole('alert')).toBeDefined();
      expect(
        screen.getByText(
          /Total permutations \(33\) exceed the backend safety limit of 25 runs/i
        )
      ).toBeDefined();

      const launchBtn = screen.getByRole('button', {
        name: /Launch Optimization/i,
      });
      expect((launchBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it('switches to Monte Carlo sampling and allows execution within cap', () => {
      render(
        <AppearanceProvider value={{ theme: 'dark', colorblindMode: 'none' }}>
          <StrategyOptimizationModal />
        </AppearanceProvider>
      );

      // Make grid search exceed quota
      const stepInput = screen.getByLabelText(/Step for fast_period/i);
      fireEvent.change(stepInput, { target: { value: '1' } });
      expect(screen.getByRole('alert')).toBeDefined();

      // Switch to Monte Carlo
      const monteCarloBtn = screen.getByRole('button', {
        name: /Monte Carlo Sampling/i,
      });
      fireEvent.click(monteCarloBtn);

      // Quota warning alert is hidden because Monte Carlo samples maxRuns
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByText(/Target Sample Runs/i)).toBeDefined();
      expect(
        (
          screen.getByRole('button', {
            name: /Launch Optimization/i,
          }) as HTMLButtonElement
        ).disabled
      ).toBe(false);
    });
  });

  describe('Optimization Campaign Execution and Ranking Table', () => {
    it('executes optimization campaign, sorts trials, and applies optimal parameters', async () => {
      const optimizeSpy = vi
        .spyOn(apiClient, 'optimizeBacktest')
        .mockResolvedValueOnce({
          optimization_id: 'opt-999',
          seed: 42,
          backtests: [],
        });

      render(
        <AppearanceProvider value={{ theme: 'dark', colorblindMode: 'none' }}>
          <StrategyOptimizationModal />
        </AppearanceProvider>
      );

      const launchBtn = screen.getByRole('button', {
        name: /Launch Optimization \(9 trials\)/i,
      });
      fireEvent.click(launchBtn);

      // Verify API client was called with proper payload
      await waitFor(() => {
        expect(optimizeSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'grid_search',
            search_space: expect.objectContaining({
              fast_period: [10, 15, 20],
              slow_period: [30, 40, 50],
            }),
            max_runs: 9,
          }),
          undefined,
          'test-token'
        );
      });

      // Wait for execution simulation to complete
      await waitFor(
        () => {
          expect(screen.getByText(/RANK #1/i)).toBeDefined();
        },
        { timeout: 5000 }
      );

      // Check results summary and trials table
      expect(
        screen.getByText(/Optimization Results \(9 trials\)/i)
      ).toBeDefined();
      const sharpeHeaders = screen.getAllByText('Sharpe');
      expect(sharpeHeaders.length).toBeGreaterThan(0);

      // Sort by Sharpe (click the table header)
      fireEvent.click(sharpeHeaders[sharpeHeaders.length - 1]!);

      // Click "Apply Best Parameters"
      const applyBestBtn = screen.getByRole('button', {
        name: /Apply Best Parameters/i,
      });
      fireEvent.click(applyBestBtn);

      // Check lab store updated
      const activeParams = useLabStore.getState().activeStrategyParameters;
      expect(Object.keys(activeParams).length).toBeGreaterThan(0);
      expect(useLabStore.getState().toast?.message).toContain(
        'Applied optimal parameters'
      );
    });
  });
});
