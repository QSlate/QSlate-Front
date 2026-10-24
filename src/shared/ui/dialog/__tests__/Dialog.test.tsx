// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { Dialog } from '../Dialog';

const originalShowModal = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal'
);
const originalClose = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close'
);
const showModal = vi.fn(function (this: HTMLDialogElement) {
  this.open = true;
  this.querySelector<HTMLButtonElement>('button')?.focus();
});
const close = vi.fn(function (this: HTMLDialogElement) {
  this.open = false;
});

beforeEach(() => {
  showModal.mockClear();
  close.mockClear();
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value: showModal },
    close: { configurable: true, value: close },
  });
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
  vi.restoreAllMocks();
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

function renderDialog(onClose = vi.fn()) {
  const view = render(
    <Dialog title="Widget settings" onClose={onClose}>
      <button type="button">Inside action</button>
    </Dialog>
  );
  const dialog = screen.getByRole<HTMLDialogElement>('dialog', {
    name: 'Widget settings',
  });
  vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(
    DOMRect.fromRect({ x: 100, y: 100, width: 300, height: 200 })
  );
  return { ...view, dialog, onClose };
}

function pointerDown(target: HTMLElement, clientX: number, clientY: number) {
  // jsdom does not implement PointerEvent in every supported version.
  fireEvent(
    target,
    new MouseEvent('pointerdown', { bubbles: true, clientX, clientY })
  );
}

describe('Dialog', () => {
  it('opens natively, locks scrolling, and restores focus and prior overflow on unmount', () => {
    render(<button type="button">Open settings</button>);
    const opener = screen.getByRole('button', { name: 'Open settings' });
    opener.focus();
    document.body.style.overflow = 'scroll';

    const { dialog, unmount } = renderDialog();

    expect(showModal).toHaveBeenCalledTimes(1);
    expect(dialog.open).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Close dialog' })
    );

    unmount();

    expect(close).toHaveBeenCalledTimes(1);
    expect(dialog.open).toBe(false);
    expect(document.body.style.overflow).toBe('scroll');
    expect(document.activeElement).toBe(opener);
  });

  it('requests a controlled close on Escape or the close button', () => {
    const { dialog, onClose } = renderDialog();

    const allowedDefault = fireEvent(
      dialog,
      new Event('cancel', { cancelable: true })
    );

    expect(allowedDefault).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dialog.open).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(close).not.toHaveBeenCalled();
  });

  it('dismisses a gesture that starts and ends on the backdrop', () => {
    const { dialog, onClose } = renderDialog();

    pointerDown(dialog, 50, 50);
    fireEvent.click(dialog, { clientX: 50, clientY: 50 });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps content interactions and dialog scrollbar gestures open', () => {
    const { dialog, onClose } = renderDialog();
    const inside = screen.getByRole('button', { name: 'Inside action' });

    pointerDown(inside, 150, 150);
    fireEvent.click(inside, { clientX: 150, clientY: 150 });
    pointerDown(dialog, 398, 150);
    fireEvent.click(dialog, { clientX: 398, clientY: 150 });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not dismiss when dragging between content and backdrop', () => {
    const { dialog, onClose } = renderDialog();
    const inside = screen.getByRole('button', { name: 'Inside action' });

    pointerDown(inside, 150, 150);
    fireEvent.click(dialog, { clientX: 50, clientY: 50 });
    pointerDown(dialog, 50, 50);
    fireEvent.click(inside, { clientX: 150, clientY: 150 });
    fireEvent.click(dialog, { clientX: 50, clientY: 50 });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('discards a cancelled backdrop gesture', () => {
    const { dialog, onClose } = renderDialog();

    pointerDown(dialog, 50, 50);
    fireEvent.pointerCancel(dialog);
    fireEvent.click(dialog, { clientX: 50, clientY: 50 });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps scrolling locked until all dialogs close, regardless of close order', () => {
    document.body.style.overflow = 'auto';
    const first = render(
      <Dialog title="First dialog" onClose={vi.fn()}>
        First content
      </Dialog>
    );
    const second = render(
      <Dialog title="Second dialog" onClose={vi.fn()}>
        Second content
      </Dialog>
    );

    first.unmount();
    expect(document.body.style.overflow).toBe('hidden');

    second.unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('balances native lifecycle and scroll locking during StrictMode effect replay', () => {
    document.body.style.overflow = 'scroll';
    const { unmount } = render(
      <StrictMode>
        <Dialog title="Strict dialog" onClose={vi.fn()}>
          Content
        </Dialog>
      </StrictMode>
    );

    expect(showModal).toHaveBeenCalledTimes(2);
    expect(close).toHaveBeenCalledTimes(1);
    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(close).toHaveBeenCalledTimes(2);
    expect(document.body.style.overflow).toBe('scroll');
  });
});
