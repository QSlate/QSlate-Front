// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_USER_PREFERENCES, useUserStore } from '@/entities/user/model';

import { ThemeSync } from '../ui/ThemeSync';

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
});
