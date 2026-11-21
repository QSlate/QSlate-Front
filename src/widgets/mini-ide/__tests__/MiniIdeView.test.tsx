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

import { useLabStore } from '@/features/lab-state';
import { apiClient, ApiError } from '@/shared/api';
import { AppearanceProvider } from '@/shared/theme';

import { MiniIdeView } from '../ui/MiniIdeView';

describe('MiniIdeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiClient, 'lintStrategy').mockResolvedValue({
      valid: true,
      diagnostics: [],
    });
    useLabStore.setState({
      ideActiveFile: 'strategy.py',
      ideAstStatus: 'valid',
      ideSplitView: false,
      strategyId: 'strat-123',
      versionId: 'ver-100',
      strategyRevision: 1,
      strategyName: 'Momentum_ETH_4h',
      strategyDiagnostics: [],
      isVersionDrawerOpen: false,
      strategyVersions: [],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders file tabs, strategy badges, and telemetry status bar', async () => {
    render(<MiniIdeView />);

    expect(screen.getByText('strategy.py')).toBeDefined();
    expect(screen.getByText('indicators.py')).toBeDefined();
    expect(screen.getByText('config.json')).toBeDefined();
    expect(screen.getByText('Momentum_ETH_4h')).toBeDefined();
    expect(screen.getByText('v1')).toBeDefined();
    expect(screen.getByText('Save Version')).toBeDefined();
    expect(screen.getByText('History')).toBeDefined();
    expect(screen.getByText('Import')).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText('AST Validated')).toBeDefined();
    });
  });

  it('switches active file tab on click', () => {
    render(<MiniIdeView />);

    const indicatorsTab = screen.getByText('indicators.py');
    act(() => {
      fireEvent.click(indicatorsTab);
    });

    expect(useLabStore.getState().ideActiveFile).toBe('indicators.py');
  });

  it('toggles split view side panel', () => {
    render(<MiniIdeView />);

    const splitBtn = screen.getByTitle('Toggle split view');
    act(() => {
      fireEvent.click(splitBtn);
    });

    expect(useLabStore.getState().ideSplitView).toBe(true);
    expect(screen.getByText('Vectorized Helper References')).toBeDefined();
  });

  it('triggers debounced linting and displays syntax error feedback', async () => {
    const lintSpy = vi.spyOn(apiClient, 'lintStrategy').mockResolvedValueOnce({
      valid: false,
      diagnostics: [
        {
          line: 5,
          column: 10,
          end_line: 5,
          end_column: 20,
          severity: 'error',
          message: 'SyntaxError: unexpected EOF while parsing',
        },
      ],
    });

    render(<MiniIdeView />);

    act(() => {
      useLabStore
        .getState()
        .updateIdeFileContent('strategy.py', 'def broken_syntax(');
    });

    await waitFor(
      () => {
        expect(lintSpy).toHaveBeenCalledWith('def broken_syntax(', 'python');
      },
      { timeout: 1000 }
    );

    await waitFor(() => {
      expect(screen.getByText(/Syntax Error: Line 5, Col 10/i)).toBeDefined();
    });
  });

  it('commits a new strategy revision on Save Version', async () => {
    const updateSpy = vi
      .spyOn(apiClient, 'updateStrategy')
      .mockResolvedValueOnce({
        id: 'strat-123',
        version_id: 'ver-101',
        revision: 2,
        name: 'Momentum_ETH_4h',
        source: '# updated code',
        parameters: {},
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      });

    render(<MiniIdeView />);

    const saveBtn = screen.getByText('Save Version');
    act(() => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('strat-123', {
        base_version_id: 'ver-100',
        source: expect.any(String),
        name: 'Momentum_ETH_4h',
      });
      expect(useLabStore.getState().strategyRevision).toBe(2);
      expect(useLabStore.getState().versionId).toBe('ver-101');
    });
  });

  it('handles 409 version conflict gracefully on Save Version', async () => {
    vi.spyOn(apiClient, 'updateStrategy').mockRejectedValueOnce(
      new ApiError(409, 'conflict', 'revision conflict')
    );

    render(<MiniIdeView />);

    const saveBtn = screen.getByText('Save Version');
    act(() => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(useLabStore.getState().toast?.type).toBe('warning');
      expect(useLabStore.getState().toast?.message).toContain(
        'Version conflict'
      );
    });
  });

  it('opens history drawer, loads past versions, and restores a revision', async () => {
    useLabStore.setState({
      versionId: 'ver-101',
      strategyRevision: 2,
    });

    const versionsSpy = vi
      .spyOn(apiClient, 'getStrategyVersions')
      .mockResolvedValueOnce({
        items: [
          {
            version_id: 'ver-101',
            revision: 2,
            name: 'Momentum_ETH_4h',
            source: '# current v2 code',
            parameters: {},
            created_at: '2026-01-02T00:00:00Z',
          },
          {
            version_id: 'ver-100',
            revision: 1,
            name: 'Momentum_ETH_4h',
            source: '# original v1 code',
            parameters: {},
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        items: [
          {
            version_id: 'ver-102',
            revision: 3,
            name: 'Momentum_ETH_4h',
            source: '# original v1 code',
            parameters: {},
            created_at: '2026-01-03T00:00:00Z',
          },
        ],
      });

    const restoreSpy = vi
      .spyOn(apiClient, 'restoreStrategyVersion')
      .mockResolvedValueOnce({
        id: 'strat-123',
        version_id: 'ver-102',
        revision: 3,
        name: 'Momentum_ETH_4h',
        source: '# original v1 code',
        parameters: {},
        created_at: '2026-01-03T00:00:00Z',
        updated_at: '2026-01-03T00:00:00Z',
      });

    render(<MiniIdeView />);

    const historyBtn = screen.getByText('History');
    act(() => {
      fireEvent.click(historyBtn);
    });

    expect(useLabStore.getState().isVersionDrawerOpen).toBe(true);
    await waitFor(() => {
      expect(versionsSpy).toHaveBeenCalledWith('strat-123');
    });

    // Find and click Restore on version 1
    const restoreButtons = screen.getAllByText('Restore');
    expect(restoreButtons.length).toBeGreaterThan(0);

    act(() => {
      fireEvent.click(restoreButtons[0]);
    });

    await waitFor(() => {
      expect(restoreSpy).toHaveBeenCalledWith('strat-123', {
        version_id: 'ver-100',
        base_version_id: 'ver-101',
      });
      expect(useLabStore.getState().strategyRevision).toBe(3);
      expect(useLabStore.getState().ideFiles['strategy.py']).toBe(
        '# original v1 code'
      );
    });
  });

  it('imports a .py strategy file via file picker', async () => {
    const importSpy = vi
      .spyOn(apiClient, 'importStrategy')
      .mockResolvedValueOnce({
        id: 'strat-imported-99',
        version_id: 'ver-99',
        revision: 1,
        name: 'CustomBreakout',
        source: '# imported breakout python source',
        parameters: {},
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      });

    const { container } = render(<MiniIdeView />);

    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).toBeDefined();

    const file = new File(['# test strategy'], 'CustomBreakout.py', {
      type: 'text/x-python',
    });

    act(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(importSpy).toHaveBeenCalledWith(file);
      expect(useLabStore.getState().strategyId).toBe('strat-imported-99');
      expect(useLabStore.getState().strategyName).toBe('CustomBreakout');
      expect(useLabStore.getState().ideFiles['strategy.py']).toBe(
        '# imported breakout python source'
      );
    });
  });

  it('renders correctly in light theme mode', async () => {
    render(
      <AppearanceProvider value={{ theme: 'light', colorblindMode: 'none' }}>
        <MiniIdeView />
      </AppearanceProvider>
    );

    expect(screen.getByText('strategy.py')).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText('AST Validated')).toBeDefined();
    });
  });
});
