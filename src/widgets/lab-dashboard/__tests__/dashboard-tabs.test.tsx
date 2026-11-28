// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { templateLayout, useDashboardStore } from '@/features/customize-lab';
import { useLabStore } from '@/features/lab-state';
import { apiClient } from '@/shared/api';
import { renderWithQuery } from '@/shared/lib/test';

import type { WidgetComponents } from '../model/types';
import { DashboardTabs } from '../ui/dashboard-tabs';

vi.mock('@/features/run-backtest', () => ({
  useBacktest: () => ({ result: null }),
}));

// The preview grid lists the widgets it would draw.
vi.mock('../ui/dashboard-grid-lazy', () => ({
  DashboardGridLazy: ({
    layout,
  }: {
    readonly layout: readonly { readonly i: string }[];
  }) => (
    <ul aria-label="grille">
      {layout.map((item) => (
        <li key={item.i}>{item.i}</li>
      ))}
    </ul>
  ),
}));

class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function Empty() {
  return null;
}

const COMPONENTS: WidgetComponents = {
  'net-return': Empty,
  'max-drawdown': Empty,
  sharpe: Empty,
  'win-rate': Empty,
  'capital-chart': Empty,
  'price-chart': Empty,
  replay: Empty,
  drawdowns: Empty,
  'monthly-returns': Empty,
  'trade-distribution': Empty,
  trades: Empty,
};

const SUMMARY = {
  id: 'd'.repeat(43),
  title: 'Mon dashboard',
  description: '',
  tags: [],
  revision: 1,
  created_at: '',
  updated_at: '',
};
const CREATED = { ...SUMMARY, id: 'n'.repeat(43), title: 'Analyse des trades' };

function nameInput(): HTMLInputElement {
  const input = screen.getByLabelText('Nom');
  if (!(input instanceof HTMLInputElement)) throw new Error('no name input');
  return input;
}

function radio(name: string): HTMLInputElement {
  const input = screen.getByRole('radio', { name });
  if (!(input instanceof HTMLInputElement)) throw new Error('no radio');
  return input;
}

async function openCreateDialog() {
  renderWithQuery(<DashboardTabs components={COMPONENTS} />);
  const button = await screen.findByRole('button', {
    name: 'Nouveau dashboard',
  });
  fireEvent.click(button);
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', NoopResizeObserver);
  useDashboardStore.setState({
    layouts: {},
    activeId: SUMMARY.id,
    draft: null,
    catalogOpen: false,
  });
  useLabStore.setState({ toast: null });
  vi.spyOn(apiClient, 'getDashboards').mockResolvedValue({ items: [SUMMARY] });
  // jsdom does not implement the modal dialog methods.
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('DashboardTabs creation', () => {
  it('offers the templates, essential first and checked', async () => {
    await openCreateDialog();

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(4);
    expect(radio('Essentiel').checked).toBe(true);
    expect(nameInput().value).toBe('Essentiel');
  });

  it('names the dashboard after the template until the user types', async () => {
    await openCreateDialog();

    fireEvent.click(radio('Analyse des trades'));
    expect(nameInput().value).toBe('Analyse des trades');

    fireEvent.change(nameInput(), { target: { value: 'Mes swings' } });
    fireEvent.click(radio('Vide'));
    expect(nameInput().value).toBe('Mes swings');
  });

  it('previews the chosen template with the real grid', async () => {
    await openCreateDialog();
    const items = () =>
      Array.from(
        document.querySelectorAll('dialog li'),
        (li) => li.textContent
      );
    expect(items()).toEqual(templateLayout('essential').map((item) => item.i));
    expect(
      screen.getByText('Lance un backtest pour remplir les widgets')
    ).toBeTruthy();

    fireEvent.click(radio('Vide'));
    expect(items()).toEqual([]);
    expect(screen.getByText('Un dashboard vide')).toBeTruthy();
  });

  it('blocks an empty name', async () => {
    await openCreateDialog();

    fireEvent.change(nameInput(), { target: { value: '   ' } });
    expect(screen.getByText('Donne un nom au dashboard.')).toBeTruthy();
    const submit = screen.getByRole('button', { name: 'Créer' });
    expect(submit instanceof HTMLButtonElement && submit.disabled).toBe(true);
  });

  it('creates the dashboard with the chosen layout and opens it', async () => {
    const create = vi
      .spyOn(apiClient, 'createDashboard')
      .mockResolvedValue({ ...CREATED, widgets: [], layout: [] });
    await openCreateDialog();
    fireEvent.click(radio('Analyse des trades'));
    fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

    await waitFor(() =>
      expect(useDashboardStore.getState().activeId).toBe(CREATED.id)
    );
    expect(create).toHaveBeenCalledWith({ title: 'Analyse des trades' });
    expect(useDashboardStore.getState().layouts[CREATED.id]).toEqual(
      templateLayout('trades')
    );
  });

  it('keeps an empty template empty', async () => {
    vi.spyOn(apiClient, 'createDashboard').mockResolvedValue({
      ...CREATED,
      widgets: [],
      layout: [],
    });
    await openCreateDialog();
    fireEvent.click(radio('Vide'));
    fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

    await waitFor(() =>
      expect(useDashboardStore.getState().layouts[CREATED.id]).toEqual([])
    );
  });
});

describe('DashboardTabs URL', () => {
  const OTHER = { ...SUMMARY, id: 'o'.repeat(43), title: 'Swing' };

  afterEach(() => window.history.replaceState(null, '', '/lab'));

  it('opens the dashboard named in the URL', async () => {
    vi.spyOn(apiClient, 'getDashboards').mockResolvedValue({
      items: [SUMMARY, OTHER],
    });
    window.history.replaceState(null, '', `/lab?dashboard=${OTHER.id}`);
    renderWithQuery(<DashboardTabs components={COMPONENTS} />);

    await waitFor(() =>
      expect(useDashboardStore.getState().activeId).toBe(OTHER.id)
    );
    const tab = await screen.findByRole('tab', { name: 'Swing' });
    expect(tab.getAttribute('aria-selected')).toBe('true');
  });

  it('ignores an unknown id and writes the shown dashboard', async () => {
    window.history.replaceState(null, '', '/lab?dashboard=unknown&tab=1');
    renderWithQuery(<DashboardTabs components={COMPONENTS} />);

    await waitFor(() =>
      expect(window.location.search).toBe(`?dashboard=${SUMMARY.id}&tab=1`)
    );
    expect(useDashboardStore.getState().activeId).toBe(SUMMARY.id);
  });

  it('follows a tab change', async () => {
    vi.spyOn(apiClient, 'getDashboards').mockResolvedValue({
      items: [SUMMARY, OTHER],
    });
    renderWithQuery(<DashboardTabs components={COMPONENTS} />);
    fireEvent.click(await screen.findByRole('tab', { name: 'Swing' }));

    await waitFor(() =>
      expect(window.location.search).toBe(`?dashboard=${OTHER.id}`)
    );
  });
});
