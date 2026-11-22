// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SegmentedControl } from '../segmented-control';

type Theme = 'dark' | 'light' | 'auto';

const OPTIONS = [
  { value: 'dark', label: 'Sombre' },
  { value: 'light', label: 'Clair' },
  { value: 'auto', label: 'Auto', disabled: true },
] as const;

function Harness({ onChange }: { readonly onChange: (v: Theme) => void }) {
  const [value, setValue] = useState<Theme>('dark');
  return (
    <SegmentedControl<Theme>
      label="Thème"
      options={OPTIONS}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SegmentedControl', () => {
  it('exposes a labelled group with aria-pressed reflecting the value', () => {
    render(<Harness onChange={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'Thème' })).toBeDefined();
    const dark = screen.getByRole('button', { name: 'Sombre' });
    const light = screen.getByRole('button', { name: 'Clair' });
    expect(dark.getAttribute('aria-pressed')).toBe('true');
    expect(light.getAttribute('aria-pressed')).toBe('false');
    expect(dark.tabIndex).toBe(0);
    expect(light.tabIndex).toBe(-1);
  });

  it('selects on click', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clair' }));

    expect(onChange).toHaveBeenCalledWith('light');
    expect(
      screen.getByRole('button', { name: 'Clair' }).getAttribute('aria-pressed')
    ).toBe('true');
  });

  it('moves selection and focus with arrow keys, skipping disabled options', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const dark = screen.getByRole('button', { name: 'Sombre' });
    const light = screen.getByRole('button', { name: 'Clair' });

    dark.focus();
    fireEvent.keyDown(dark, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('light');
    expect(document.activeElement).toBe(light);

    fireEvent.keyDown(light, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('dark');
    expect(document.activeElement).toBe(dark);

    fireEvent.keyDown(dark, { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith('light');
  });
});
