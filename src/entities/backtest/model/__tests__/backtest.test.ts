import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createMockBacktest,
  mockBacktestService,
} from '../../api/mockBacktestService';
import {
  DEFAULT_BACKTEST_CONFIG,
  type Timeframe,
  validateBacktest,
  validateBacktestFields,
} from '../types';

afterEach(() => vi.useRealTimers());

describe('backtest configuration', () => {
  it.each([
    { startDate: '2026-07-01' },
    { endDate: '' },
    { startDate: '2026-02-30' },
    { capital: 0 },
    { capital: Number.NaN },
    { capital: Number.POSITIVE_INFINITY },
    { strategyId: 'missing' },
    { timeframe: 'invalid' as Timeframe },
  ])('rejects invalid input %o', (changes) => {
    expect(
      validateBacktest({ ...DEFAULT_BACKTEST_CONFIG, ...changes })
    ).not.toBeNull();
  });

  it('accepts a single-day backtest', () => {
    expect(
      validateBacktest({ ...DEFAULT_BACKTEST_CONFIG, startDate: '2026-06-30' })
    ).toBeNull();
  });

  it('reports every invalid field and associates reversed dates with the end date', () => {
    expect(
      validateBacktestFields({
        ...DEFAULT_BACKTEST_CONFIG,
        strategyId: 'missing',
        startDate: '',
        endDate: '2026-02-29',
        capital: 0,
        timeframe: 'invalid' as Timeframe,
      })
    ).toEqual({
      strategyId: 'Select an available strategy.',
      startDate: 'Enter a valid start date.',
      endDate: 'Enter a valid end date.',
      capital: 'Initial capital must be greater than zero.',
      timeframe: 'Select a valid timeframe.',
    });
    expect(
      validateBacktestFields({
        ...DEFAULT_BACKTEST_CONFIG,
        startDate: '2026-07-01',
      })
    ).toEqual({ endDate: 'The end date must be on or after the start date.' });
    expect(
      validateBacktestFields({
        ...DEFAULT_BACKTEST_CONFIG,
        startDate: '2024-02-29',
        endDate: '2024-02-29',
      })
    ).toEqual({});
  });
});

describe('mock service boundary', () => {
  it('produces reproducible results with matching NAV, PnL, monthly returns and trade count', () => {
    const result = createMockBacktest(DEFAULT_BACKTEST_CONFIG);
    expect(createMockBacktest(DEFAULT_BACKTEST_CONFIG)).toEqual(result);
    const endingNav = result.equity[result.equity.length - 1].nav;
    const totalPnl = result.trades.reduce((sum, trade) => sum + trade.pnl, 0);
    expect(DEFAULT_BACKTEST_CONFIG.capital + totalPnl).toBeCloseTo(endingNav);
    const compounded = result.monthlyReturns.reduce(
      (nav, month) => nav * (1 + month.value / 100),
      DEFAULT_BACKTEST_CONFIG.capital
    );
    expect(compounded).toBeCloseTo(endingNav);
    expect(result.metrics.trades).toBe(result.trades.length);
    expect(result.trades[0].timestamp).toBeGreaterThan(
      result.trades[1].timestamp
    );
    expect(result.source).toBe('mock');
    expect(
      result.equity.every(
        (point, index) =>
          index === 0 || point.time > result.equity[index - 1].time
      )
    ).toBe(true);
  });

  it('scales capital and respects the selected period and strategy', () => {
    const base = createMockBacktest(DEFAULT_BACKTEST_CONFIG);
    const doubled = createMockBacktest({
      ...DEFAULT_BACKTEST_CONFIG,
      capital: 200_000,
    });
    expect(doubled.equity[100].nav).toBeCloseTo(base.equity[100].nav * 2);
    const custom = createMockBacktest({
      ...DEFAULT_BACKTEST_CONFIG,
      strategyId: 'mean-reversion',
      startDate: '2026-06-01',
    });
    expect(
      new Date(custom.equity[0].time * 1000).toISOString().slice(0, 10)
    ).toBe('2026-06-01');
    expect(custom.equity[custom.equity.length - 1].nav).not.toEqual(
      base.equity[base.equity.length - 1].nav
    );
  });

  it('owns its configuration snapshot independently of the caller', () => {
    const config = { ...DEFAULT_BACKTEST_CONFIG };
    const result = createMockBacktest(config);
    config.capital = 500_000;
    expect(result.config.capital).toBe(DEFAULT_BACKTEST_CONFIG.capital);
    result.config.capital = 200_000;
    expect(config.capital).toBe(500_000);
  });

  it('keeps execution prices positive and PnL consistent when capital changes', () => {
    const result = createMockBacktest({
      ...DEFAULT_BACKTEST_CONFIG,
      capital: 100_000_000,
    });
    for (const trade of result.trades) {
      expect(trade.entry).toBeGreaterThan(0);
      expect(trade.exit).toBeGreaterThan(0);
      expect(trade.quantity).toBeGreaterThan(0);
      expect(
        trade.quantity *
          (trade.exit - trade.entry) *
          (trade.side === 'BUY' ? 1 : -1)
      ).toBeCloseTo(trade.pnl);
    }
  });

  it('does not add extra intraday trades for a single daily interval', () => {
    const result = createMockBacktest({
      ...DEFAULT_BACKTEST_CONFIG,
      startDate: DEFAULT_BACKTEST_CONFIG.endDate,
      timeframe: '1d',
    });
    expect(result.equity).toHaveLength(2);
    expect(result.trades).toHaveLength(1);
    expect(result.metrics.profitFactor).toBeNull();
    expect(result.metrics.calmar).toBeNull();
    expect(
      Object.values(result.metrics).every(
        (value) => value === null || Number.isFinite(value)
      )
    ).toBe(true);
  });

  it('includes the recovery observation in drawdown duration', () => {
    const result = createMockBacktest({
      ...DEFAULT_BACKTEST_CONFIG,
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      timeframe: '1d',
    });
    // The June 17 peak recovers on June 22, one day after the final loss.
    expect(result.longestDrawdownDays).toBe(5);
  });

  it('snapshots the submitted configuration before the asynchronous delay', async () => {
    vi.useFakeTimers();
    const config = { ...DEFAULT_BACKTEST_CONFIG };
    const pending = mockBacktestService.run(config);
    config.capital = 0;
    config.startDate = '';
    await vi.runAllTimersAsync();
    expect((await pending).config).toEqual(DEFAULT_BACKTEST_CONFIG);
  });

  it('rejects an already aborted request without keeping a timer', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    controller.abort();
    await expect(
      mockBacktestService.run(DEFAULT_BACKTEST_CONFIG, controller.signal)
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('removes the abort listener after a successful run', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const removeListener = vi.spyOn(controller.signal, 'removeEventListener');
    const pending = mockBacktestService.run(
      DEFAULT_BACKTEST_CONFIG,
      controller.signal
    );
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toHaveProperty('source', 'mock');
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels pending execution through AbortSignal', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const pending = mockBacktestService.run(
      DEFAULT_BACKTEST_CONFIG,
      controller.signal
    );
    const assertion = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    controller.abort();
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });
});
