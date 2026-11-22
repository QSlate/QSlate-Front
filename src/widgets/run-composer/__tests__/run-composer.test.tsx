// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useComposerStore } from '@/features/compose-backtest';
import {
  apiClient,
  type CustomDataset,
  type StrategySummary,
} from '@/shared/api';

import { RunComposer } from '../ui/run-composer';
import { RunComposerHint } from '../ui/run-composer-hint';

const mockRun = vi.fn();
const mockCancel = vi.fn();
const mockStatus = vi.fn<() => 'idle' | 'running'>(() => 'idle');
vi.mock('@/features/run-backtest', () => ({
  useBacktest: () => ({
    status: mockStatus(),
    run: mockRun,
    cancel: mockCancel,
  }),
}));

const STRATEGY: StrategySummary = {
  id: 'strat-a',
  version_id: 'ver-a3',
  revision: 3,
  name: 'RSI Trend',
  created_at: '',
  updated_at: '',
};

const DATASET: CustomDataset = {
  id: 'ds-eth',
  version_id: 'dsv-1',
  name: 'ETH 4h',
  status: 'ready',
  format: 'csv',
  columns: [],
  row_count: 2190,
  symbol: 'ETHUSDT',
  created_at: '',
  updated_at: '',
};

function mockCatalog(strategies: StrategySummary[], datasets: CustomDataset[]) {
  vi.spyOn(apiClient, 'getStrategies').mockResolvedValue({ items: strategies });
  vi.spyOn(apiClient, 'getCustomDatasets').mockResolvedValue({
    items: datasets,
  });
  vi.spyOn(apiClient, 'getStrategy').mockResolvedValue({
    ...STRATEGY,
    source: '',
    parameters: { rsi_period: 14 },
  });
}

function renderComposer() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <RunComposer />
      <RunComposerHint />
    </QueryClientProvider>
  );
}

async function launchButton() {
  return screen.findByRole('button', { name: /Lancer/ });
}

beforeEach(() => {
  useComposerStore.setState({ selections: {} });
  mockStatus.mockReturnValue('idle');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  localStorage.clear();
});

describe('RunComposer', () => {
  it('explains that a strategy is needed and links to the editor', async () => {
    mockCatalog([], [DATASET]);
    renderComposer();

    const hint = await screen.findByText(
      'Crée ou importe une stratégie pour lancer un backtest.'
    );
    expect(hint.closest('[role="status"]')).not.toBeNull();
    expect(
      screen
        .getByRole('link', { name: "Ouvrir l'éditeur" })
        .getAttribute('href')
    ).toBe('/lab/ide');

    const launch = await launchButton();
    expect(launch.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(launch);
    expect(mockRun).not.toHaveBeenCalled();

    fireEvent.focus(launch);
    expect(screen.getByRole('tooltip').textContent).toBe(
      'Crée ou importe une stratégie pour lancer un backtest.'
    );
  });

  it('explains that a ready dataset is needed and links to the data page', async () => {
    mockCatalog([STRATEGY], [{ ...DATASET, status: 'mapped' }]);
    renderComposer();

    expect(
      await screen.findByText(
        'Importe un jeu de données pour lancer un backtest.'
      )
    ).toBeDefined();
    expect(
      screen
        .getByRole('link', { name: 'Gérer mes données' })
        .getAttribute('href')
    ).toBe('/lab/data');
    expect(
      screen.getByRole('combobox', { name: 'Données' }).hasAttribute('disabled')
    ).toBe(true);
  });

  it('flags an invalid capital and blocks the run', async () => {
    mockCatalog([STRATEGY], [DATASET]);
    renderComposer();
    const capital = await screen.findByRole('spinbutton', {
      name: 'Capital initial en USD',
    });
    await screen.findByRole('option', { name: 'RSI Trend' });

    fireEvent.change(capital, { target: { value: '0' } });

    expect(capital.getAttribute('aria-invalid')).toBe('true');
    expect(capital.getAttribute('aria-describedby')).toBe('run-composer-hint');
    expect(
      screen.getByText("Le capital doit être d'au moins 0,01 USD.")
    ).toBeDefined();
    expect((await launchButton()).getAttribute('aria-disabled')).toBe('true');
  });

  it('runs the selection with Ctrl+Enter and with the Lancer button', async () => {
    mockCatalog([STRATEGY], [DATASET]);
    renderComposer();
    await screen.findByText('v3');
    await waitFor(async () =>
      expect((await launchButton()).hasAttribute('aria-disabled')).toBe(false)
    );

    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenCalledWith(
      expect.objectContaining({
        strategyId: 'strat-a',
        strategyVersionId: 'ver-a3',
        datasetId: 'ds-eth',
        datasetVersionId: 'dsv-1',
        initialCapital: 10_000,
      })
    );
    expect(screen.getByText(/2.190 bougies/)).toBeDefined();

    fireEvent.click(await launchButton());
    expect(mockRun).toHaveBeenCalledTimes(2);
  });

  it('shows Arrêter while a backtest runs and cancels it', async () => {
    mockStatus.mockReturnValue('running');
    mockCatalog([STRATEGY], [DATASET]);
    renderComposer();

    const stop = await screen.findByRole('button', { name: 'Arrêter' });
    expect(screen.queryByRole('button', { name: /Lancer/ })).toBeNull();

    fireEvent.click(stop);
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });
});
