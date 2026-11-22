// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Drawer } from '../../drawer';
import { InfoTip, Tooltip } from '../tooltip';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('Tooltip', () => {
  it('shows on keyboard focus and links the trigger with aria-describedby', () => {
    render(
      <InfoTip
        label="À propos du ratio de Sharpe"
        content="Rendement ajusté du risque."
      />
    );
    const trigger = screen.getByRole('button', {
      name: 'À propos du ratio de Sharpe',
    });

    expect(screen.queryByRole('tooltip')).toBeNull();

    fireEvent.focus(trigger);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.textContent).toBe('Rendement ajusté du risque.');
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);
  });

  it('hides on Escape and on blur', () => {
    render(<InfoTip label="Aide" content="Explication" />);
    const trigger = screen.getByRole('button', { name: 'Aide' });

    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip')).toBeDefined();

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);

    fireEvent.blur(trigger);
    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip')).toBeDefined();

    fireEvent.blur(trigger);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('opens on hover and closes on Escape pressed anywhere', () => {
    render(
      <Tooltip content="Bientôt">
        {(props) => (
          <button type="button" {...props}>
            Cible
          </button>
        )}
      </Tooltip>
    );
    const trigger = screen.getByRole('button', { name: 'Cible' });

    fireEvent.pointerEnter(trigger);
    expect(screen.getByRole('tooltip').textContent).toBe('Bientôt');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('stays open while the pointer moves from the trigger onto the bubble', () => {
    render(
      <Tooltip content="Explication longue">
        {(props) => (
          <button type="button" {...props}>
            Cible
          </button>
        )}
      </Tooltip>
    );
    const trigger = screen.getByRole('button', { name: 'Cible' });

    fireEvent.pointerEnter(trigger);
    const bubble = screen.getByRole('tooltip');

    fireEvent.pointerOut(trigger, { relatedTarget: bubble });
    expect(screen.getByRole('tooltip')).toBeDefined();

    fireEvent.pointerOut(bubble, { relatedTarget: document.body });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('consumes Escape so an enclosing drawer stays open', () => {
    vi.useFakeTimers();
    // jsdom has no modal dialog support: stub the two native methods.
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
    const onClose = vi.fn();
    render(
      <Drawer open onClose={onClose} title="Réglages avancés">
        <InfoTip label="Aide frais" content="Frais prélevés par trade." />
      </Drawer>
    );
    const drawer = screen.getByRole('dialog', { name: 'Réglages avancés' });
    const trigger = screen.getByRole('button', { name: 'Aide frais' });

    fireEvent.focus(trigger);
    const escape = fireEvent.keyDown(trigger, { key: 'Escape' });
    // Browsers send the dialog `cancel` right after the keydown.
    fireEvent(drawer, new Event('cancel', { cancelable: true }));

    expect(escape).toBe(false);
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    vi.runAllTimers();
    fireEvent.keyDown(trigger, { key: 'Escape' });
    fireEvent(drawer, new Event('cancel', { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);

    cleanup();
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  });
});
