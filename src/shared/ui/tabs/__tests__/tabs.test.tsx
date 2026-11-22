// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { Tabs } from '../tabs';

type TabId = 'perf' | 'risk';

function Harness() {
  const [value, setValue] = useState<TabId>('perf');
  return (
    <Tabs<TabId>
      label="Dashboards"
      value={value}
      onValueChange={setValue}
      items={[
        { id: 'perf', label: 'Performance', panel: <p>Panneau perf</p> },
        { id: 'risk', label: 'Risque', panel: <p>Panneau risque</p> },
      ]}
    />
  );
}

afterEach(() => {
  cleanup();
});

describe('Tabs', () => {
  it('links the selected tab to its panel and switches with arrow keys', () => {
    render(<Harness />);
    const perf = screen.getByRole('tab', { name: 'Performance' });
    const risk = screen.getByRole('tab', { name: 'Risque' });

    expect(perf.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel', { name: 'Performance' })).toBeDefined();

    perf.focus();
    fireEvent.keyDown(perf, { key: 'ArrowRight' });

    expect(risk.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(risk);
    expect(screen.getByRole('tabpanel').textContent).toBe('Panneau risque');
  });
});
