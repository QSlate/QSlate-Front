// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Switch } from '../switch';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Switch', () => {
  it('exposes its state and toggles on click', () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        aria-label="Stop loss"
        checked={false}
        onCheckedChange={onCheckedChange}
      />
    );

    const toggle = screen.getByRole('switch', { name: 'Stop loss' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
