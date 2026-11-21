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

import { useAuthStore } from '@/entities/user/model';
import { useLabStore } from '@/features/lab-state';
import { apiClient } from '@/shared/api';
import { AppearanceProvider } from '@/shared/theme';
import { LabToolbar } from '@/widgets/lab-toolbar/LabToolbar';

import { ExecutionLogsConsole } from '../ui/ExecutionLogsConsole';

const mockBacktest = {
  status: 'idle',
  run: vi.fn(),
  error: null,
  config: {
    strategyId: 'momentum-eth',
    startDate: '2026-01-01',
    endDate: '2026-06-01',
    timeframe: '1h',
    capital: 100000,
  },
  result: null,
  setConfig: vi.fn(),
};

vi.mock('@/features/run-backtest/BacktestProvider', () => ({
  useBacktest: () => mockBacktest,
}));

describe('ExecutionLogsConsole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBacktest.status = 'idle';

    useLabStore.setState({
      isExecutionLogsOpen: true,
      loadedBacktestId: null,
      toast: null,
    });

    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: 'test-token',
    });

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
    }
    if (!global.URL.revokeObjectURL) {
      global.URL.revokeObjectURL = vi.fn();
    }
  });

  afterEach(() => {
    cleanup();
  });

  const renderWithProviders = (ui: React.ReactElement) =>
    render(
      <AppearanceProvider value={{ theme: 'dark', colorblindMode: 'none' }}>
        {ui}
      </AppearanceProvider>
    );

  it('renders nothing when closed', () => {
    useLabStore.setState({ isExecutionLogsOpen: false });
    const { container } = renderWithProviders(<ExecutionLogsConsole />);

    expect(container.firstChild).toBeNull();
  });

  it('renders the execution logs console and default sandbox runtime logs when open', () => {
    renderWithProviders(<ExecutionLogsConsole />);

    expect(
      screen.getByText('Execution Logs & Diagnostics Console')
    ).toBeDefined();
    expect(screen.getByText(/gVisor Kernel Sandbox/i)).toBeDefined();
    expect(screen.getByText(/Polars 1.18 SIMD vectorization/i)).toBeDefined();
    expect(screen.getByText(/Network egress: Restricted/i)).toBeDefined();
    expect(screen.getByText(/Kernel Stream: Synchronized/i)).toBeDefined();
  });

  it('filters logs by search query and shows empty state when no match', () => {
    renderWithProviders(<ExecutionLogsConsole />);

    const searchInput = screen.getByPlaceholderText(
      'Filter logs or tracebacks...'
    );

    fireEvent.change(searchInput, { target: { value: 'Polars' } });

    expect(screen.getByText(/Polars 1.18 SIMD/i)).toBeDefined();
    expect(screen.queryByText(/gVisor Kernel Sandbox/i)).toBeNull();

    fireEvent.change(searchInput, { target: { value: 'NonExistentTermXYZ' } });
    expect(
      screen.getByText('No log entries match your active filter.')
    ).toBeDefined();
  });

  it('filters logs by level chips (INFO, WARN, ERROR, ALL)', () => {
    renderWithProviders(<ExecutionLogsConsole />);

    const warnChip = screen.getByRole('button', { name: 'WARN' });
    fireEvent.click(warnChip);

    // Default sandbox logs have no WARN lines initially
    expect(
      screen.getByText('No log entries match your active filter.')
    ).toBeDefined();

    const infoChip = screen.getByRole('button', { name: 'INFO' });
    fireEvent.click(infoChip);

    expect(screen.getByText(/gVisor Kernel Sandbox/i)).toBeDefined();

    const allChip = screen.getByRole('button', { name: 'ALL' });
    fireEvent.click(allChip);

    expect(screen.getByText(/gVisor Kernel Sandbox/i)).toBeDefined();
  });

  it('toggles autoscroll button state', () => {
    renderWithProviders(<ExecutionLogsConsole />);

    const autoscrollBtn = screen.getByTitle('Toggle sticky autoscroll');
    expect(autoscrollBtn).toBeDefined();

    fireEvent.click(autoscrollBtn);
    expect(autoscrollBtn.className).toContain('bg-zinc-800');

    fireEvent.click(autoscrollBtn);
    expect(autoscrollBtn.className).toContain('bg-blue-600/30');
  });

  it('copies logs to clipboard when clicking copy button', async () => {
    renderWithProviders(<ExecutionLogsConsole />);

    const copyBtn = screen.getByTitle('Copy logs');
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(useLabStore.getState().toast?.message).toBe(
      'Execution logs copied to clipboard'
    );
  });

  it('exports log file when clicking export button', () => {
    renderWithProviders(<ExecutionLogsConsole />);

    const exportBtn = screen.getByTitle('Export as .log file');
    fireEvent.click(exportBtn);

    expect(useLabStore.getState().toast?.message).toBe(
      'Exported execution log file (.log)'
    );
  });

  it('clears logs when clicking clear button', () => {
    renderWithProviders(<ExecutionLogsConsole />);

    const clearBtn = screen.getByTitle('Clear logs');
    fireEvent.click(clearBtn);

    expect(
      screen.getByText('No log entries match your active filter.')
    ).toBeDefined();
    expect(useLabStore.getState().toast?.message).toBe('Terminal logs cleared');
  });

  it('closes console when clicking close button', () => {
    renderWithProviders(<ExecutionLogsConsole />);

    const closeBtn = screen.getByTitle('Close console (Esc)');
    fireEvent.click(closeBtn);
    expect(useLabStore.getState().isExecutionLogsOpen).toBe(false);
  });

  it('closes console when pressing Escape key', () => {
    renderWithProviders(<ExecutionLogsConsole />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useLabStore.getState().isExecutionLogsOpen).toBe(false);
  });

  it('automatically opens console and logs error traceback when backtest status is error', () => {
    useLabStore.setState({ isExecutionLogsOpen: false });
    mockBacktest.status = 'error';

    renderWithProviders(<ExecutionLogsConsole />);

    expect(useLabStore.getState().isExecutionLogsOpen).toBe(true);
    expect(
      screen.getByText(
        /Simulation execution failed: Python traceback captured/i
      )
    ).toBeDefined();
  });

  it('fetches historical logs from backend API when loadedBacktestId is present', async () => {
    useLabStore.setState({
      isExecutionLogsOpen: true,
      loadedBacktestId: 'backtest-uuid-1234567890',
    });

    const getLogsSpy = vi
      .spyOn(apiClient, 'getBacktestLogs')
      .mockResolvedValue({
        items: [
          { message: '[BACKEND] Starting order book replay...' },
          { message: '[BACKEND] Execution completed with 0 errors.' },
        ],
        next_cursor: '',
      });

    renderWithProviders(<ExecutionLogsConsole />);

    await waitFor(() => {
      expect(getLogsSpy).toHaveBeenCalledWith(
        'backtest-uuid-1234567890',
        { limit: 200 },
        'test-token'
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText('[BACKEND] Starting order book replay...')
      ).toBeDefined();
      expect(
        screen.getByText('[BACKEND] Execution completed with 0 errors.')
      ).toBeDefined();
    });
  });

  it('toggles execution logs via LabToolbar button', () => {
    useLabStore.setState({ isExecutionLogsOpen: false });

    renderWithProviders(<LabToolbar onAddWidget={vi.fn()} />);

    const logsBtn = screen.getByRole('button', {
      name: 'Toggle execution logs',
    });
    expect(logsBtn).toBeDefined();
    expect(logsBtn.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(logsBtn);
    expect(useLabStore.getState().isExecutionLogsOpen).toBe(true);
  });
});
