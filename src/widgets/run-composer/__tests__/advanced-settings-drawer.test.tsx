// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useComposerStore } from '@/features/compose-backtest';
import { apiClient } from '@/shared/api';

import { RunComposer } from '../ui/run-composer';

const mockRun = vi.fn();
vi.mock('@/features/run-backtest', () => ({
  useBacktest: () => ({ status: 'idle', run: mockRun, cancel: vi.fn() }),
}));

const STRATEGY = {
  id: 'strat-a',
  version_id: 'ver-a3',
  revision: 3,
  name: 'RSI Trend',
  created_at: '',
  updated_at: '',
};

beforeAll(() => {
  // jsdom has no modal dialog support: emulate the native methods.
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = true;
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = false;
      },
    },
  });
});

afterAll(() => {
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

beforeEach(() => {
  useComposerStore.setState({ selections: {} });
  vi.spyOn(apiClient, 'getStrategies').mockResolvedValue({
    items: [STRATEGY],
  });
  vi.spyOn(apiClient, 'getMarketSymbols').mockResolvedValue({
    items: [
      {
        symbol: 'ETH/USDT@1h',
        name: 'Ether / Tether — 1 hour',
        dataset_id: 'ds-eth',
        version_id: 'dsv-1',
        live: false,
      },
    ],
  });
  vi.spyOn(apiClient, 'getStrategy').mockResolvedValue({
    ...STRATEGY,
    source: '',
    parameters: {
      rsi_period: 14,
      use_stop: true,
      mode: 'long',
      bands: [1, 2],
    },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  localStorage.clear();
});

async function openDrawer() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <RunComposer />
    </QueryClientProvider>
  );
  await screen.findByText('v3');
  fireEvent.click(screen.getByRole('button', { name: /^Réglages avancés/ }));
  const drawer = screen.getByRole('dialog', { name: 'Réglages avancés' });
  await within(drawer).findByText('rsi_period');
  return drawer;
}

describe('AdvancedSettingsDrawer', () => {
  it('renders one typed control per scalar strategy parameter', async () => {
    const drawer = await openDrawer();

    expect(within(drawer).getByText('Paramètres de RSI Trend')).toBeDefined();
    expect(
      within(drawer).getByRole('spinbutton', { name: /RSI period/ })
    ).toBeDefined();
    expect(
      within(drawer)
        .getByRole('switch', { name: /Use stop/ })
        .getAttribute('aria-checked')
    ).toBe('true');
    expect(
      within(drawer).getByRole('textbox', { name: /Mode/ })
    ).toHaveProperty('value', 'long');
    expect(within(drawer).queryByText('bands')).toBeNull();
  });

  it('counts modified settings, shows defaults and sends the overrides', async () => {
    const drawer = await openDrawer();

    fireEvent.change(
      within(drawer).getByRole('spinbutton', { name: /RSI period/ }),
      { target: { value: '21' } }
    );
    fireEvent.change(
      within(drawer).getByRole('spinbutton', { name: 'Frais par trade' }),
      { target: { value: '0.1' } }
    );
    fireEvent.click(within(drawer).getByRole('switch', { name: /Use stop/ }));

    expect(within(drawer).getAllByText(/Modifié · défaut/)).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Réglages avancés (3)' })
    ).toBeDefined();

    fireEvent.click(within(drawer).getByRole('button', { name: 'Terminé' }));
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });

    expect(mockRun).toHaveBeenCalledWith(
      expect.objectContaining({
        parameters: { rsi_period: 21, use_stop: false },
        commissionRate: 0.001,
      })
    );
  });

  it('validates costs and resets everything to defaults', async () => {
    const drawer = await openDrawer();
    const warmUp = within(drawer).getByRole('spinbutton', {
      name: 'Historique de chauffe',
    });

    fireEvent.change(warmUp, { target: { value: '0' } });
    expect(warmUp.getAttribute('aria-invalid')).toBe('true');
    expect(
      within(drawer).getByText(/L'historique de chauffe doit être un entier/)
    ).toBeDefined();

    fireEvent.change(
      within(drawer).getByRole('spinbutton', { name: /RSI period/ }),
      { target: { value: '30' } }
    );
    fireEvent.click(
      within(drawer).getByRole('button', { name: 'Réinitialiser' })
    );

    expect(
      within(drawer).getByRole('spinbutton', { name: /RSI period/ })
    ).toHaveProperty('value', '14');
    expect(warmUp.getAttribute('aria-invalid')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Réglages avancés' })
    ).toBeDefined();
  });
});
