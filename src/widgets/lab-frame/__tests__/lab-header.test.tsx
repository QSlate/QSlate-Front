// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LabHeader } from '../ui/lab-header';

interface MockBacktest {
  error: { message: string; action: 'retry' | 'reconnect' | 'none' } | null;
  status: string;
  retry: () => void;
  canRetry: boolean;
}

const mockBacktest = vi.fn((): MockBacktest => ({
  error: null,
  status: 'idle',
  retry: vi.fn(),
  canRetry: false,
}));
vi.mock('@/features/run-backtest', () => ({
  useBacktest: () => mockBacktest(),
}));

const IDLE: MockBacktest = {
  error: null,
  status: 'idle',
  retry: vi.fn(),
  canRetry: false,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockBacktest.mockReturnValue(IDLE);
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
    const retry = vi.fn();
    mockBacktest.mockReturnValue({
      error: { message: 'Le moteur ne répond pas', action: 'retry' },
      status: 'error',
      retry,
      canRetry: true,
    });
    render(<LabHeader title="Lab" />);

    expect(screen.getByRole('alert').textContent).toContain(
      'Le moteur ne répond pas'
    );
    screen.getByRole('button', { name: 'Réessayer' }).click();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('hides the retry action when the error cannot be fixed by retrying', () => {
    mockBacktest.mockReturnValue({
      error: { message: 'Réglages refusés.', action: 'none' },
      status: 'error',
      retry: vi.fn(),
      canRetry: true,
    });
    render(<LabHeader title="Lab" />);

    expect(screen.getByRole('alert').textContent).toContain(
      'Réglages refusés.'
    );
    expect(screen.queryByRole('button', { name: 'Réessayer' })).toBeNull();
  });

  it('offers to sign in again when the error is an expired session', () => {
    mockBacktest.mockReturnValue({
      error: { message: 'Ta session a expiré.', action: 'reconnect' },
      status: 'error',
      retry: vi.fn(),
      canRetry: true,
    });
    render(<LabHeader title="Lab" />);

    expect(
      screen.getByRole('link', { name: 'Se connecter' }).getAttribute('href')
    ).toBe('/login');
  });
});
