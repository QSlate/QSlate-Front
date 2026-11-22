import { afterEach, describe, expect, it } from 'vitest';

import { useLoadedBacktestStore } from '../loaded-backtest-store';

describe('useLoadedBacktestStore', () => {
  afterEach(() => useLoadedBacktestStore.setState({ loadedBacktestId: null }));

  it('starts with no loaded backtest', () => {
    expect(useLoadedBacktestStore.getState().loadedBacktestId).toBeNull();
  });

  it('tracks and resets the loaded backtest', () => {
    useLoadedBacktestStore.getState().setLoadedBacktestId('bt');
    expect(useLoadedBacktestStore.getState().loadedBacktestId).toBe('bt');
    useLoadedBacktestStore.getState().setLoadedBacktestId(null);
    expect(useLoadedBacktestStore.getState().loadedBacktestId).toBeNull();
  });
});
