// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Stat } from '../stat';

const percent = (value: number) => value.toFixed(1).replace('.', ',');

afterEach(() => {
  cleanup();
});

describe('Stat', () => {
  it('renders a positive signed value with ▲, a plus sign and gain colour', () => {
    render(
      <Stat label="Rendement" value={12.4} format={percent} unit="%" signed />
    );

    const figure = screen.getByText('+12,4').closest('p');
    expect(figure?.textContent).toContain('▲');
    expect(figure?.textContent).toContain('en hausse');
    expect(figure?.className).toContain('text-gain');
  });

  it('renders a negative signed value with ▼, a minus sign and loss colour', () => {
    render(
      <Stat
        label="Drawdown max"
        value={-3.2}
        format={percent}
        unit="%"
        signed
      />
    );

    const figure = screen.getByText('−3,2').closest('p');
    expect(figure?.textContent).toContain('▼');
    expect(figure?.textContent).toContain('en baisse');
    expect(figure?.className).toContain('text-loss');
  });

  it('keeps unsigned values neutral without arrows', () => {
    render(<Stat label="Trades" value={42} />);

    const figure = screen.getByText('42').closest('p');
    expect(figure?.textContent).not.toMatch(/[▲▼+]/);
    expect(figure?.className).not.toContain('text-gain');
  });

  it('renders an em dash with an accessible note when the value is missing', () => {
    render(<Stat label="Sharpe" value={null} signed sub="Lance un backtest" />);

    expect(screen.getByText('—')).toBeDefined();
    expect(screen.getByText('non disponible')).toBeDefined();
    expect(screen.getByText('Lance un backtest')).toBeDefined();
  });

  it('shows an info tooltip trigger when an explanation is provided', () => {
    render(
      <Stat label="Sharpe" value={1.8} info="Rendement par unité de risque." />
    );

    expect(
      screen.getByRole('button', { name: 'À propos : Sharpe' })
    ).toBeDefined();
  });
});
