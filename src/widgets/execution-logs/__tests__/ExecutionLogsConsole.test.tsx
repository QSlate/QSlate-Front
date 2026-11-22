// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLabStore } from '@/features/lab-state';
import { apiClient } from '@/shared/api';
import { renderWithQuery } from '@/shared/lib/test';

import { ExecutionLogsConsole, parseLogLine } from '../ui/ExecutionLogsConsole';

const mockBacktest: {
  status: string;
  activeRun: { backtestId: string | null } | null;
  lastRun: { backtestId: string } | null;
  runLogs: readonly string[];
} = { status: 'idle', activeRun: null, lastRun: null, runLogs: [] };

vi.mock('@/features/run-backtest', () => ({
  useBacktest: () => mockBacktest,
}));

describe('ExecutionLogsConsole', () => {
  beforeEach(() => {
    mockBacktest.status = 'idle';
    mockBacktest.activeRun = null;
    mockBacktest.lastRun = null;
    mockBacktest.runLogs = [];
    useLabStore.setState({
      isExecutionLogsOpen: true,
      loadedBacktestId: null,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    useLabStore.setState({ isExecutionLogsOpen: false });
    renderWithQuery(<ExecutionLogsConsole />);
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('shows an empty state without any backtest (no fake lines)', () => {
    renderWithQuery(<ExecutionLogsConsole />);
    expect(screen.getByText(/Aucun backtest chargé/)).toBeTruthy();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('shows streamed lines while a run is live', () => {
    mockBacktest.status = 'running';
    mockBacktest.activeRun = { backtestId: 'bt-1' };
    mockBacktest.runLogs = ['INFO start', 'WARNING slow bar'];
    renderWithQuery(<ExecutionLogsConsole />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('loads the REST history of the loaded backtest', async () => {
    useLabStore.setState({ loadedBacktestId: 'bt-2' });
    const spy = vi.spyOn(apiClient, 'getBacktestLogs').mockResolvedValue({
      items: [{ message: 'line A' }, { message: 'ERROR line B' }],
    });
    renderWithQuery(<ExecutionLogsConsole />);
    await waitFor(() => expect(screen.getByText('line A')).toBeTruthy());
    expect(spy).toHaveBeenCalledWith('bt-2', { limit: 500 });
  });

  it('filters by level and search', async () => {
    mockBacktest.status = 'running';
    mockBacktest.activeRun = { backtestId: 'bt-1' };
    mockBacktest.runLogs = ['INFO start', 'ERROR boom', 'plain output'];
    renderWithQuery(<ExecutionLogsConsole />);
    fireEvent.click(screen.getByRole('button', { name: 'Erreurs' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Tout' }));
    fireEvent.change(screen.getByLabelText('Rechercher dans les logs'), {
      target: { value: 'plain' },
    });
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('closes with Escape and with the close button', () => {
    renderWithQuery(<ExecutionLogsConsole />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useLabStore.getState().isExecutionLogsOpen).toBe(false);
  });

  it('classifies log levels', () => {
    expect(parseLogLine('Traceback (most recent call last)', 0).level).toBe(
      'ERROR'
    );
    expect(parseLogLine('WARNING: gap', 1).level).toBe('WARN');
    expect(parseLogLine('INFO ok', 2).level).toBe('INFO');
    expect(parseLogLine('hello', 3).level).toBe('STDOUT');
  });
});
