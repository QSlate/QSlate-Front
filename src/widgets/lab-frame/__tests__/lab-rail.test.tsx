// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore, useUserStore } from '@/entities/user';
import { apiClient } from '@/shared/api';

import { isDestinationActive, LabRail } from '../ui/lab-rail';

const mockPush = vi.fn();
const mockPathname = vi.fn(() => '/lab');
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname(),
}));

const mockStatus = vi.fn<() => 'idle' | 'running'>(() => 'idle');
vi.mock('@/features/run-backtest', () => ({
  useBacktest: () => ({ status: mockStatus() }),
}));

const AUTH_SESSION = {
  user: {
    id: 77,
    email: 'sarah.quant@example.com',
    username: 'sarah_q',
    display_name: 'Sarah Connor',
    email_verified: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  access_token: 'valid.token',
  token_type: 'Bearer',
  expires_in: 900,
};

describe('LabRail', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useUserStore.getState().clearSession();
    useUserStore.getState().setTheme('dark');
    mockPathname.mockReturnValue('/lab');
    mockStatus.mockReturnValue('idle');
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders every destination with a visible label inside a named nav', () => {
    render(<LabRail />);

    const nav = screen.getByRole('navigation', {
      name: 'Navigation principale',
    });
    for (const [label, href] of [
      ['Lab', '/lab'],
      ['Stratégies', '/lab/ide'],
      ['Données', '/lab/data'],
      ['Historique', '/lab/runs'],
      ['Market', '/lab/marketplace'],
      ['Réglages', '/lab/settings'],
    ] as const) {
      const link = screen.getByRole('link', { name: label });
      expect(nav.contains(link)).toBe(true);
      expect(link.getAttribute('href')).toBe(href);
    }
  });

  it('marks only the current route with aria-current="page"', () => {
    mockPathname.mockReturnValue('/lab/runs');
    render(<LabRail />);

    expect(
      screen
        .getByRole('link', { name: 'Historique' })
        .getAttribute('aria-current')
    ).toBe('page');
    expect(
      screen.getByRole('link', { name: 'Lab' }).hasAttribute('aria-current')
    ).toBe(false);
  });

  it('flags the Lab destination while a backtest is running', () => {
    mockStatus.mockReturnValue('running');
    render(<LabRail />);

    expect(
      screen.getByRole('link', { name: /^Lab.*backtest en cours$/ })
    ).toBeDefined();
  });

  it('shows the authenticated user initials on the account button', () => {
    useAuthStore.getState().setAuth(AUTH_SESSION);
    render(<LabRail />);

    const account = screen.getByRole('button', {
      name: 'Compte de Sarah Connor',
    });
    expect(account.textContent).toBe('SC');
    expect(account.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the account panel, toggles the theme and closes on Escape', async () => {
    useAuthStore.getState().setAuth(AUTH_SESSION);
    render(<LabRail />);
    const account = screen.getByRole('button', {
      name: 'Compte de Sarah Connor',
    });

    fireEvent.click(account);
    expect(account.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('sarah.quant@example.com')).toBeDefined();

    fireEvent.click(
      screen.getByRole('button', { name: 'Passer en thème clair' })
    );
    await waitFor(() => {
      expect(useUserStore.getState().theme).toBe('light');
    });

    const daltonism = screen.getByRole('switch', {
      name: 'Mode daltonien (orange / bleu)',
    });
    expect(daltonism.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(daltonism);
    expect(useUserStore.getState().colorblindMode).toBe('orange-blue');
    useUserStore.getState().setColorblindMode('none');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(account.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(account);
  });

  it('closes the account panel when focus leaves it', () => {
    useAuthStore.getState().setAuth(AUTH_SESSION);
    render(
      <>
        <LabRail />
        <button type="button">Ailleurs</button>
      </>
    );
    const account = screen.getByRole('button', {
      name: 'Compte de Sarah Connor',
    });
    fireEvent.click(account);
    const themeButton = screen.getByRole('button', {
      name: 'Passer en thème clair',
    });

    fireEvent.blur(account, { relatedTarget: themeButton });
    expect(account.getAttribute('aria-expanded')).toBe('true');

    fireEvent.blur(themeButton, {
      relatedTarget: screen.getByRole('button', { name: 'Ailleurs' }),
    });
    expect(account.getAttribute('aria-expanded')).toBe('false');
  });

  it('ignores an Escape already handled by a nested layer', () => {
    useAuthStore.getState().setAuth(AUTH_SESSION);
    render(<LabRail />);
    const account = screen.getByRole('button', {
      name: 'Compte de Sarah Connor',
    });
    fireEvent.click(account);

    const consumed = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    consumed.preventDefault();
    fireEvent(document, consumed);
    expect(account.getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(account.getAttribute('aria-expanded')).toBe('false');
  });

  it('signs out: calls the API, clears the session and redirects to /login', async () => {
    useAuthStore.getState().setAuth(AUTH_SESSION);
    const logoutSpy = vi.spyOn(apiClient, 'logout').mockResolvedValueOnce();
    render(<LabRail />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Compte de Sarah Connor' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }));

    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('isDestinationActive', () => {
  it('matches /lab exactly and nested routes by prefix', () => {
    expect(isDestinationActive('/lab', '/lab')).toBe(true);
    expect(isDestinationActive('/lab/ide', '/lab')).toBe(false);
    expect(isDestinationActive('/lab/ide', '/lab/ide')).toBe(true);
    expect(isDestinationActive('/lab/ide/abc', '/lab/ide')).toBe(true);
    expect(isDestinationActive('/lab/ideas', '/lab/ide')).toBe(false);
  });
});
