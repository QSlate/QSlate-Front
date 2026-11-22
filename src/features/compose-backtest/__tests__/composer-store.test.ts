// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import {
  COMPOSER_STORAGE_KEY,
  DEFAULT_COMPOSER_SELECTION,
  sanitizeSelection,
  useComposerStore,
} from '../model/composer-store';

afterEach(() => {
  useComposerStore.setState({ selections: {} });
  localStorage.clear();
});

describe('composer store', () => {
  it('starts empty and falls back to defaults for unknown users', () => {
    expect(useComposerStore.getState().selections).toEqual({});
  });

  it('keeps one selection per user and persists it', () => {
    const { update } = useComposerStore.getState();
    update('user-1', { strategyId: 's1', capital: 5000 });
    update('user-2', { datasetId: 'd2' });

    const { selections } = useComposerStore.getState();
    expect(selections['user-1']).toEqual({
      ...DEFAULT_COMPOSER_SELECTION,
      strategyId: 's1',
      capital: 5000,
    });
    expect(selections['user-2']?.strategyId).toBeNull();

    const stored = JSON.parse(
      localStorage.getItem(COMPOSER_STORAGE_KEY) ?? '{}'
    );
    expect(stored.state.selections['user-1'].capital).toBe(5000);
  });

  it('sets, clears and resets parameter overrides and costs', () => {
    const { setParameter, update, resetAdvanced } = useComposerStore.getState();
    setParameter('u', 's1', 'rsi_period', 21);
    setParameter('u', 's1', 'mode', 'short');
    setParameter('u', 's1', 'mode', null);
    update('u', { commissionPercent: 0.1, window: 40 });

    expect(
      useComposerStore.getState().selections.u?.parameterOverrides
    ).toEqual({
      s1: { rsi_period: 21 },
    });

    resetAdvanced('u', 's1');
    const reset = useComposerStore.getState().selections.u;
    expect(reset?.parameterOverrides).toEqual({});
    expect(reset?.commissionPercent).toBe(0);
    expect(reset?.window).toBe(200);
  });

  it('sanitizes corrupted persisted selections', () => {
    expect(sanitizeSelection('nope')).toEqual(DEFAULT_COMPOSER_SELECTION);
    expect(
      sanitizeSelection({
        strategyId: 42,
        capital: 'lots',
        window: null,
        parameterOverrides: { s1: { ok: 1, bad: { nested: true } }, s2: 3 },
      })
    ).toEqual({
      ...DEFAULT_COMPOSER_SELECTION,
      window: null,
      parameterOverrides: { s1: { ok: 1 } },
    });
  });
});
