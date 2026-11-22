// @vitest-environment jsdom
import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api';
import { renderWithQuery } from '@/shared/lib/test';

import { BacktestComparisonModal } from '../ui/BacktestComparisonModal';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('BacktestComparisonModal', () => {
  it('compares real summary metrics and marks the best value', async () => {
    vi.spyOn(apiClient, 'compareBacktests').mockResolvedValue({
      summaries: [
        {
          backtest_id: 'a',
          metrics: { return_pct: 12.5, sharpe_ratio: 1.2, max_drawdown_pct: 8 },
        },
        {
          backtest_id: 'b',
          metrics: { return_pct: -3, sharpe_ratio: 0.4, max_drawdown_pct: 3 },
        },
      ],
    });
    renderWithQuery(
      <BacktestComparisonModal
        runs={[
          { id: 'a', label: 'Run A' },
          { id: 'b', label: 'Run B' },
        ]}
        onClose={vi.fn()}
      />
    );
    const returnRow = (
      await screen.findByRole('rowheader', { name: 'Rendement net' })
    ).closest('tr');
    expect(returnRow?.textContent).toContain('▲ +12,5 %');
    expect(
      within(returnRow as HTMLElement).getByLabelText('meilleur')
    ).toBeTruthy();
    const drawdownRow = screen
      .getByRole('rowheader', { name: 'Baisse maximale' })
      .closest('tr');
    expect(
      drawdownRow?.querySelectorAll('[aria-label="meilleur"]')
    ).toHaveLength(1);
    const profitRow = screen
      .getByRole('rowheader', { name: 'Profit factor' })
      .closest('tr');
    expect(profitRow?.textContent).toContain('—');
  });
});
