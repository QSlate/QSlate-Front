// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithQuery } from '@/shared/lib/test';

import { formatAgo, formatDuration, formatElapsed } from '../model/run-timing';
import { RunStatusStrip } from '../ui/run-status-strip';

const backtest = vi.fn();
vi.mock('@/features/run-backtest', () => ({
  useBacktest: () => backtest(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('RunStatusStrip', () => {
  it('shows the idle pill without any backtest', () => {
    backtest.mockReturnValue({
      status: 'idle',
      activeRun: null,
      lastRun: null,
      runLogs: [],
      result: { id: '' },
    });
    renderWithQuery(<RunStatusStrip />);
    expect(screen.getByRole('status').textContent).toContain('Prêt');
  });

  it('shows live progress and the last log line', () => {
    backtest.mockReturnValue({
      status: 'running',
      activeRun: { startedAt: Date.now(), job: { progress: 62 } },
      lastRun: null,
      runLogs: ['first', 'buy 3412.5'],
      result: { id: '' },
    });
    renderWithQuery(<RunStatusStrip />);
    expect(screen.getByRole('status').textContent).toBe('En cours · 62 %');
    expect(screen.getByText('› buy 3412.5')).toBeTruthy();
  });
});

describe('run timing format', () => {
  it('formats elapsed, duration and age in French', () => {
    expect(formatElapsed(14_000)).toBe('00:14');
    expect(formatElapsed(3_723_000)).toBe('1:02:03');
    expect(formatDuration(18_000)).toBe('18 s');
    expect(formatDuration(125_000)).toBe('2 min 05 s');
    expect(formatAgo(10_000)).toBe("à l'instant");
    expect(formatAgo(120_000)).toBe('il y a 2 min');
  });
});
