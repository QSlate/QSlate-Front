// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_USER_PREFERENCES, useUserStore } from '@/entities/user/model';
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
});
