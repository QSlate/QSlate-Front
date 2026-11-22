// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { IconButton } from '../../icon-button';
import { Button } from '../button';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Button', () => {
  it('defaults to type="button" and calls onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Lancer</Button>);

    const button = screen.getByRole('button', { name: 'Lancer' });
    expect(button.getAttribute('type')).toBe('button');

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Lancer
      </Button>
    );

    const button = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Lancer',
    });
    expect(button.disabled).toBe(true);

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is disabled and busy while loading', () => {
    render(
      <Button variant="primary" loading>
        Lancer
      </Button>
    );

    const button = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Lancer',
    });
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });
});

describe('IconButton', () => {
  it('exposes its label as the accessible name and hides the icon', () => {
    render(<IconButton icon={<svg data-icon />} label="Réglages avancés" />);

    const button = screen.getByRole('button', { name: 'Réglages avancés' });
    expect(button.querySelector('[aria-hidden="true"] svg')).not.toBeNull();
  });

  it('includes a positive count in the accessible name', () => {
    render(<IconButton icon={<svg />} label="Notifications" count={3} />);

    expect(
      screen.getByRole('button', { name: 'Notifications (3)' })
    ).toBeDefined();
  });
});
