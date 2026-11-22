// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useLabStore } from '@/features/lab-state';

import { DatasetsView } from '../ui/datasets-view';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  useLabStore.getState().setCustomDatasetsDrawerOpen(false);
});

describe('DatasetsView', () => {
  it('explains that guided import is upcoming and opens the datasets drawer', () => {
    render(<DatasetsView />);

    expect(
      screen.getByText("L'import guidé de données arrive bientôt")
    ).toBeDefined();

    fireEvent.click(
      screen.getByRole('button', { name: 'Gérer mes jeux de données' })
    );

    expect(useLabStore.getState().isCustomDatasetsDrawerOpen).toBe(true);
  });
});
