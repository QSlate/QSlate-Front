// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_USER_PREFERENCES, useUserStore } from '@/entities/user/model';

import { ThemeSync } from '../theme-sync';

describe('ThemeSync', () => {
  beforeEach(() => {
    localStorage.clear();
    useUserStore.setState({
      ...DEFAULT_USER_PREFERENCES,
      session: null,
    });
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark', 'light');
  });

  afterEach(() => {
    cleanup();
  });

  it('applies Zustand theme changes to the document element', async () => {
    render(<ThemeSync />);

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    act(() => {
      useUserStore.getState().setTheme('light');
    });

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });
  });
});
