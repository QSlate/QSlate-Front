// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_USER_PREFERENCES,
  useAuthStore,
  useUserStore,
} from '@/entities/user/model';
import { apiClient } from '@/shared/api';
import { useAppearance } from '@/shared/theme';

import { ThemeSync } from '../ui/ThemeSync';

function AppearanceProbe() {
  const { theme, colorblindMode } = useAppearance();
  return <span data-testid="appearance">{`${theme}:${colorblindMode}`}</span>;
}

describe('ThemeSync', () => {
  beforeEach(() => {
    localStorage.clear();
    useUserStore.setState({
      ...DEFAULT_USER_PREFERENCES,
      session: null,
    });
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    cleanup();
  });

  it('keeps the document theme synchronized with Zustand', async () => {
    render(<ThemeSync />);

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    act(() => {
      useUserStore.getState().setTheme('light');
    });

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('light');
    });
  });

  it('provides saved preferences to descendants and follows preference changes', () => {
    useUserStore.setState({ theme: 'light', colorblindMode: 'orange-blue' });
    render(
      <ThemeSync>
        <AppearanceProbe />
      </ThemeSync>
    );

    expect(screen.getByTestId('appearance').textContent).toBe(
      'light:orange-blue'
    );

    act(() => {
      useUserStore.getState().setTheme('dark');
      useUserStore.getState().setColorblindMode('none');
    });

    expect(screen.getByTestId('appearance').textContent).toBe('dark:none');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('uses stable server defaults even when local preferences differ', () => {
    useUserStore.setState({ theme: 'light', colorblindMode: 'orange-blue' });

    const html = renderToString(
      <ThemeSync>
        <AppearanceProbe />
      </ThemeSync>
    );

    expect(html).toContain('dark:none');
    expect(html).not.toContain('light:orange-blue');
  });

  it('hydrates user preferences from backend when authenticated', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: 'auth-jwt-token-xyz',
      user: {
        id: 1,
        email: 'user@qslate.com',
        username: 'trader1',
        created_at: '2026-01-01',
        display_name: 'Trader One',
        email_verified: true,
      },
    });

    vi.spyOn(apiClient, 'getUserPreferences').mockResolvedValueOnce({
      theme: 'light',
      colorblind_mode: true,
    });

    render(
      <ThemeSync>
        <AppearanceProbe />
      </ThemeSync>
    );

    await waitFor(() => {
      expect(screen.getByTestId('appearance').textContent).toBe(
        'light:orange-blue'
      );
      expect(document.documentElement.dataset.theme).toBe('light');
    });

    expect(apiClient.getUserPreferences).toHaveBeenCalledWith(
      'auth-jwt-token-xyz'
    );
  });

  it('debounces preference sync to backend on local change', async () => {
    vi.useFakeTimers();

    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: 'auth-jwt-token-xyz',
    });

    vi.spyOn(apiClient, 'getUserPreferences').mockResolvedValueOnce({
      theme: 'dark',
      colorblind_mode: false,
    });

    const updateSpy = vi
      .spyOn(apiClient, 'updateUserPreferences')
      .mockResolvedValueOnce({
        theme: 'light',
        colorblind_mode: true,
      });

    render(
      <ThemeSync>
        <AppearanceProbe />
      </ThemeSync>
    );

    // Initial mount ignores update
    act(() => {
      useUserStore.getState().setTheme('light');
      useUserStore.getState().setColorblindMode('orange-blue');
    });

    expect(updateSpy).not.toHaveBeenCalled();

    // Fast-forward past debounce timer
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(updateSpy).toHaveBeenCalledWith(
      { theme: 'light', colorblind_mode: true },
      'auth-jwt-token-xyz'
    );

    vi.useRealTimers();
  });
});
