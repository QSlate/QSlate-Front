// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { Drawer } from '../drawer';

const originalShowModal = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal'
);
const originalClose = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close'
);

// jsdom does not implement modal dialogs: emulate open state and the
// browser's initial focus on the first focusable element.
const showModal = vi.fn(function (this: HTMLDialogElement) {
  this.open = true;
  this.querySelector<HTMLButtonElement>('button')?.focus();
});
const close = vi.fn(function (this: HTMLDialogElement) {
  this.open = false;
});

beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value: showModal },
    close: { configurable: true, value: close },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  document.body.style.overflow = '';
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

describe('Drawer', () => {
  it('renders nothing while closed', () => {
    render(
      <Drawer open={false} onClose={vi.fn()} title="Réglages avancés">
        Contenu
      </Drawer>
    );

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(showModal).not.toHaveBeenCalled();
  });

  it('opens as a labelled modal, moves focus inside and locks scrolling', () => {
    render(
      <Drawer
        open
        onClose={vi.fn()}
        title="Réglages avancés"
        description="Frais, slippage et période."
      >
        <button type="button">Appliquer</button>
      </Drawer>
    );

    const drawer = screen.getByRole('dialog', { name: 'Réglages avancés' });
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(drawer.getAttribute('aria-describedby')).toBeTruthy();
    expect(drawer.contains(document.activeElement)).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('requests a close on Escape (cancel), close button and backdrop click', () => {
    const onClose = vi.fn();
    render(
      <Drawer open onClose={onClose} title="Réglages avancés">
        <p>Contenu</p>
      </Drawer>
    );
    const drawer = screen.getByRole('dialog', { name: 'Réglages avancés' });

    const allowedDefault = fireEvent(
      drawer,
      new Event('cancel', { cancelable: true })
    );
    expect(allowedDefault).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(drawer);
    expect(onClose).toHaveBeenCalledTimes(3);

    fireEvent.click(screen.getByText('Contenu'));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('restores focus to the opener when it closes', () => {
    const { rerender } = render(
      <>
        <button type="button">Ouvrir</button>
        <Drawer open={false} onClose={vi.fn()} title="Panneau">
          Contenu
        </Drawer>
      </>
    );
    const opener = screen.getByRole('button', { name: 'Ouvrir' });
    opener.focus();

    rerender(
      <>
        <button type="button">Ouvrir</button>
        <Drawer open onClose={vi.fn()} title="Panneau">
          Contenu
        </Drawer>
      </>
    );
    expect(document.activeElement).not.toBe(opener);

    rerender(
      <>
        <button type="button">Ouvrir</button>
        <Drawer open={false} onClose={vi.fn()} title="Panneau">
          Contenu
        </Drawer>
      </>
    );
    expect(close).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
    expect(document.body.style.overflow).toBe('');
  });
});
