// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LabHeader } from '../ui/lab-header';

const mockBacktest = vi.fn(() => ({
  error: null as string | null,
  status: 'idle',
  run: vi.fn(),
}));
vi.mock('@/features/run-backtest', () => ({
  useBacktest: () => mockBacktest(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LabHeader', () => {
  it('renders the page title as the single h1 with its actions', () => {
    render(
      <LabHeader
        title="Historique"
        subtitle="12 runs"
        actions={<button type="button">Exporter</button>}
      />
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Historique' })
    ).toBeDefined();
    expect(screen.getByText('12 runs')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Exporter' })).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the backtest error with a retry action', () => {
    const run = vi.fn();
    mockBacktest.mockReturnValueOnce({
      error: 'Le moteur ne répond pas',
      status: 'error',
      run,
    });
    render(<LabHeader title="Lab" />);

    expect(screen.getByRole('alert').textContent).toContain(
      'Le moteur ne répond pas'
    );
    screen.getByRole('button', { name: 'Réessayer' }).click();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('offers to sign in again when the error is an expired session', () => {
    mockBacktest.mockReturnValueOnce({
      error: 'Session expirée, merci de vous reconnecter',
      status: 'error',
      run: vi.fn(),
    });
    render(<LabHeader title="Lab" />);

    expect(
      screen.getByRole('link', { name: 'Se connecter' }).getAttribute('href')
    ).toBe('/login');
  });
});
