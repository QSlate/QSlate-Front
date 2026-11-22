// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useUserStore } from '@/entities/user/model';
import { apiClient } from '@/shared/api';
import { AppearanceProvider } from '@/shared/theme';

import { SettingsView } from '../ui/SettingsView';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const KEY = {
  id: 'k1',
  name: 'CI runner',
  scopes: [],
  created_at: '2026-01-01T00:00:00Z',
  expires_at: '2099-01-01T00:00:00Z',
  revoked_at: null,
};

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
});

beforeEach(() => {
  vi.spyOn(apiClient, 'getApiKeys').mockResolvedValue({ items: [KEY] });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function renderView() {
  return render(
    <AppearanceProvider value={{ theme: 'dark', colorblindMode: 'none' }}>
      <SettingsView />
    </AppearanceProvider>
  );
}

describe('SettingsView', () => {
  it('shows only real settings: appearance, API keys and account', async () => {
    renderView();
    expect(screen.getByRole('heading', { name: 'Apparence' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Clés API du runner' })
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Compte' })).toBeTruthy();
    expect(await screen.findByText('CI runner')).toBeTruthy();
    expect(screen.queryByText(/slippage|sandbox/i)).toBeNull();
  });

  it('switches theme and colour-blind mode', () => {
    const setTheme = vi.spyOn(useUserStore.getState(), 'setTheme');
    renderView();
    fireEvent.click(screen.getByRole('button', { name: 'Clair' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bleu / orange' }));
    expect(useUserStore.getState().colorblindMode).toBe('orange-blue');
    setTheme.mockRestore();
  });

  it('creates a key and shows its secret once', async () => {
    const create = vi
      .spyOn(apiClient, 'createApiKey')
      .mockResolvedValue({ key: KEY, secret: 'qs_secret' });
    renderView();
    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle clé' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: 'Laptop' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Créer la clé' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        name: 'Laptop',
        expires_in_days: 90,
      })
    );
    expect(await screen.findByText('qs_secret')).toBeTruthy();
  });
});
