// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WidgetCatalogDrawer } from '../ui/widget-catalog-drawer';

// jsdom does not implement modal dialogs.
HTMLDialogElement.prototype.showModal = function showModal(
  this: HTMLDialogElement
) {
  this.open = true;
};
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  this.open = false;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('WidgetCatalogDrawer', () => {
  it('marks placed widgets and adds the others', () => {
    const onAdd = vi.fn();
    render(
      <WidgetCatalogDrawer
        open
        onClose={vi.fn()}
        placed={['capital-chart']}
        onAdd={onAdd}
      />
    );
    expect(
      screen.queryByRole('button', { name: 'Ajouter Capital' })
    ).toBeNull();
    expect(screen.getAllByText('Sur le dashboard')).toHaveLength(1);
    fireEvent.click(
      screen.getByRole('button', { name: 'Ajouter Graphique de prix' })
    );
    expect(onAdd).toHaveBeenCalledWith('price-chart');
  });

  it('keeps the full description in a tooltip', () => {
    render(
      <WidgetCatalogDrawer open onClose={vi.fn()} placed={[]} onAdd={vi.fn()} />
    );
    const description = screen.getByText(/La plus forte chute du capital/);
    expect(description.getAttribute('title')).toBe(description.textContent);
  });
});
