// @vitest-environment jsdom
import { QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useDashboardStore } from '@/features/customize-lab';
import { apiClient } from '@/shared/api';
import { createTestQueryClient } from '@/shared/lib/test';

import type { WidgetComponents } from '../model/types';
import { CustomizeDashboardButton, LabDashboard } from '../ui/lab-dashboard';

vi.mock('../ui/dashboard-grid-lazy', () => ({
  DashboardGridLazy: () => null,
}));

function Empty() {
  return null;
}

const COMPONENTS: WidgetComponents = {
  'net-return': Empty,
  'max-drawdown': Empty,
  sharpe: Empty,
  'win-rate': Empty,
  'capital-chart': Empty,
  drawdowns: Empty,
  'monthly-returns': Empty,
  'trade-distribution': Empty,
  trades: Empty,
};

const originalShowModal = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal'
);
const originalClose = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close'
);

function renderLab() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <CustomizeDashboardButton />
      <LabDashboard components={COMPONENTS} />
    </QueryClientProvider>
  );
}

const toolbar = () =>
  screen.queryByRole('toolbar', { name: 'Mode personnalisation' });
const toggle = () => screen.getByRole('button', { name: 'Personnaliser' });

beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = true;
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = false;
      },
    },
  });
  useDashboardStore.setState({
    layouts: {},
    activeId: null,
    draft: null,
    catalogOpen: false,
  });
  vi.spyOn(apiClient, 'getDashboards').mockResolvedValue({ items: [] });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

afterAll(() => {
  for (const [name, descriptor] of [
    ['showModal', originalShowModal],
    ['close', originalClose],
  ] as const) {
    if (descriptor)
      Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
});

describe('LabDashboard edit mode', () => {
  it('toggles edit mode from the header button', () => {
    renderLab();
    fireEvent.click(toggle());
    expect(toolbar()).not.toBeNull();
    expect(toggle().getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(toggle());
    expect(toolbar()).toBeNull();
    expect(toggle().getAttribute('aria-pressed')).toBe('false');
  });

  it('asks before discarding unsaved changes', () => {
    renderLab();
    fireEvent.click(toggle());
    act(() => useDashboardStore.getState().updateDraft([]));

    fireEvent.click(toggle());
    expect(toolbar()).not.toBeNull();
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Quitter sans enregistrer' })[0]!
    );
    expect(toolbar()).toBeNull();
  });

  it('leaves edit mode on Escape', () => {
    renderLab();
    fireEvent.click(toggle());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(toolbar()).toBeNull();
  });

  it('ignores Escape while the widget catalog is open', () => {
    renderLab();
    fireEvent.click(toggle());
    act(() => useDashboardStore.getState().setCatalogOpen(true));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(useDashboardStore.getState().draft).not.toBeNull();
  });

  it('leaves edit mode when the dashboard unmounts', () => {
    const { unmount } = renderLab();
    fireEvent.click(toggle());
    unmount();
    expect(useDashboardStore.getState().draft).toBeNull();
  });
});
