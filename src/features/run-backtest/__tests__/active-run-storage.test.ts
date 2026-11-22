// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import {
  clearActiveRun,
  persistActiveRun,
  readActiveRun,
} from '../model/active-run-storage';

afterEach(() => {
  localStorage.clear();
});

describe('active run storage', () => {
  it('round-trips the followed job', () => {
    persistActiveRun({ backtestId: 'bt-1', request: null, startedAt: 42 });
    expect(readActiveRun()).toEqual({
      backtestId: 'bt-1',
      request: null,
      startedAt: 42,
    });
    clearActiveRun();
    expect(readActiveRun()).toBeNull();
  });

  it('drops corrupted entries', () => {
    localStorage.setItem('qslate_active_backtest', '{"backtestId":3}');
    expect(readActiveRun()).toBeNull();
    expect(localStorage.getItem('qslate_active_backtest')).toBeNull();
  });
});
