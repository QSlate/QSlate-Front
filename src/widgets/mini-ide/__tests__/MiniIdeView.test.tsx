// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useLabStore } from '@/features/lab-state';
import { AppearanceProvider } from '@/shared/theme';

import { MiniIdeView } from '../ui/MiniIdeView';

describe('MiniIdeView', () => {
  beforeEach(() => {
    useLabStore.setState({
      ideActiveFile: 'strategy.py',
      ideAstStatus: 'valid',
      ideSplitView: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders file tabs and telemetry status bar', () => {
    render(<MiniIdeView />);

    expect(screen.getByText('strategy.py')).toBeDefined();
    expect(screen.getByText('indicators.py')).toBeDefined();
    expect(screen.getByText('config.json')).toBeDefined();
    expect(screen.getByText('AST Validated')).toBeDefined();
    expect(screen.getByText('Python 3.12')).toBeDefined();
  });

  it('switches active file tab on click', () => {
    render(<MiniIdeView />);

    const indicatorsTab = screen.getByText('indicators.py');
    act(() => {
      fireEvent.click(indicatorsTab);
    });

    expect(useLabStore.getState().ideActiveFile).toBe('indicators.py');
  });

  it('toggles split view side panel', () => {
    render(<MiniIdeView />);

    const splitBtn = screen.getByTitle('Toggle split view');
    act(() => {
      fireEvent.click(splitBtn);
    });

    expect(useLabStore.getState().ideSplitView).toBe(true);
    expect(screen.getByText('Vectorized Helper References')).toBeDefined();
  });

  it('renders correctly in light theme mode', () => {
    render(
      <AppearanceProvider value={{ theme: 'light', colorblindMode: 'none' }}>
        <MiniIdeView />
      </AppearanceProvider>
    );

    expect(screen.getByText('strategy.py')).toBeDefined();
    expect(screen.getByText('AST Validated')).toBeDefined();
  });
});
