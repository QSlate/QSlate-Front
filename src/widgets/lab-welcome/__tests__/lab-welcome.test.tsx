// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api';
import { renderWithQuery } from '@/shared/lib/test';

import { LabWelcome } from '../ui/lab-welcome';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('LabWelcome', () => {
  it('locks the run step until a strategy exists', async () => {
    vi.spyOn(apiClient, 'getStrategies').mockResolvedValue({ items: [] });
    renderWithQuery(<LabWelcome />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(await screen.findByText("Disponible après l'étape 2")).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: "Ouvrir l'éditeur" })
        .getAttribute('href')
    ).toBe('/lab/ide');
  });
});
