// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { InfoTip, Tooltip } from '../tooltip';

afterEach(() => {
  cleanup();
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
});
