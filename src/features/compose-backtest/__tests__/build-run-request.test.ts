import { describe, expect, it } from 'vitest';

import { toBacktestRunPayload } from '@/entities/backtest';
import type { CustomDataset, StrategySummary } from '@/shared/api';

import {
  buildRunRequest,
  countAdvancedChanges,
  validateComposerFields,
} from '../model/build-run-request';
import {
  type ComposerSelection,
  DEFAULT_COMPOSER_SELECTION,
} from '../model/composer-store';
import {
  commissionPercentToRate,
  commissionRateToPercent,
} from '../model/cost-units';
import {
  describeParameters,
  effectiveOverrides,
} from '../model/strategy-parameters';

const STRATEGY: StrategySummary = {
  id: 'strat-a',
  version_id: 'ver-a3',
  revision: 3,
  name: 'RSI Trend',
  created_at: '',
  updated_at: '',
};

const DATASET: CustomDataset = {
  id: 'ds-eth',
  version_id: 'dsv-1',
  name: 'ETH 4h',
  status: 'ready',
  format: 'csv',
  columns: [],
  row_count: 2190,
  symbol: 'ETHUSDT',
  created_at: '',
  updated_at: '',
};

const DEFAULTS = {
  rsi_period: 14,
  use_stop: true,
  mode: 'long',
  bands: [1, 2],
};

function selection(patch: Partial<ComposerSelection> = {}): ComposerSelection {
  return { ...DEFAULT_COMPOSER_SELECTION, ...patch };
}

describe('cost units', () => {
  it('converts the fee percentage to the backend fraction and back', () => {
    expect(commissionPercentToRate(0.1)).toBe(0.001);
    expect(commissionPercentToRate(0.07)).toBe(0.0007);
    expect(commissionPercentToRate(10)).toBe(0.1);
    expect(commissionPercentToRate(0)).toBe(0);
    expect(commissionRateToPercent(0.001)).toBe(0.1);
  });
});

describe('strategy parameters', () => {
  it('types editable fields by their default value and skips non scalars', () => {
    expect(describeParameters(DEFAULTS)).toEqual([
      { key: 'rsi_period', kind: 'number', defaultValue: 14 },
      { key: 'use_stop', kind: 'boolean', defaultValue: true },
      { key: 'mode', kind: 'string', defaultValue: 'long' },
    ]);
  });

  it('keeps only overrides that change a known parameter with the same type', () => {
    expect(
      effectiveOverrides(DEFAULTS, {
        rsi_period: 21,
        use_stop: true,
        mode: 3,
        unknown: 1,
      })
    ).toEqual({ rsi_period: 21 });
  });
});

describe('buildRunRequest', () => {
  it('produces the exact POST /backtests/run body from the composer state', () => {
    const result = buildRunRequest({
      selection: selection({
        strategyId: 'strat-a',
        datasetId: 'ds-eth',
        capital: 25_000.5,
        commissionPercent: 0.1,
        slippageBps: 5,
        window: 50,
        parameterOverrides: {
          'strat-a': { rsi_period: 21, mode: 'long' },
          'strat-b': { rsi_period: 99 },
        },
      }),
      strategies: [STRATEGY],
      datasets: [DATASET],
      strategyDefaults: DEFAULTS,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(toBacktestRunPayload(result.request)).toEqual({
      strategy_id: 'strat-a',
      strategy_version_id: 'ver-a3',
      dataset_id: 'ds-eth',
      dataset_version_id: 'dsv-1',
      initial_capital: '25000.50',
      parameters: { rsi_period: 21 },
      window: 50,
      commission_rate: 0.001,
      slippage_bps: 5,
    });
  });

  it('uses the backend defaults and omits parameters when nothing changed', () => {
    const result = buildRunRequest({
      selection: selection(),
      strategies: [STRATEGY],
      datasets: [DATASET],
      strategyDefaults: null,
    });

    expect(result.ok && toBacktestRunPayload(result.request)).toEqual({
      strategy_id: 'strat-a',
      strategy_version_id: 'ver-a3',
      dataset_id: 'ds-eth',
      dataset_version_id: 'dsv-1',
      initial_capital: '10000.00',
      window: 20,
      commission_rate: 0,
      slippage_bps: 0,
    });
  });

  it('falls back to the first strategy and dataset when the saved ones are gone', () => {
    const result = buildRunRequest({
      selection: selection({ strategyId: 'deleted', datasetId: 'deleted' }),
      strategies: [STRATEGY],
      datasets: [DATASET],
      strategyDefaults: null,
    });

    expect(result.ok && result.request.strategyId).toBe('strat-a');
    expect(result.ok && result.request.datasetId).toBe('ds-eth');
  });

  it('lists every blocker when nothing can run', () => {
    const result = buildRunRequest({
      selection: selection({ capital: 0, window: 2.5 }),
      strategies: [],
      datasets: [],
      strategyDefaults: null,
    });

    expect(result).toEqual({
      ok: false,
      blockers: [
        { kind: 'no-strategy' },
        { kind: 'no-dataset' },
        { kind: 'invalid-field', field: 'capital' },
        { kind: 'invalid-field', field: 'window' },
      ],
    });
  });
});

describe('validateComposerFields', () => {
  it('explains invalid values in French', () => {
    expect(
      validateComposerFields(
        selection({
          capital: null,
          commissionPercent: 12,
          slippageBps: -1,
          window: 0,
        })
      )
    ).toEqual({
      capital: 'Le capital doit être supérieur à 0.',
      commissionPercent: 'Les frais doivent être compris entre 0 et 10 %.',
      slippageBps: expect.stringContaining('Le glissement'),
      window: expect.stringContaining("L'historique de chauffe"),
    });
  });
});

describe('countAdvancedChanges', () => {
  it('counts modified parameters, costs and warm-up', () => {
    expect(countAdvancedChanges(selection(), 'strat-a', DEFAULTS)).toBe(0);
    expect(
      countAdvancedChanges(
        selection({
          commissionPercent: 0.1,
          window: 30,
          parameterOverrides: { 'strat-a': { rsi_period: 21, use_stop: true } },
        }),
        'strat-a',
        DEFAULTS
      )
    ).toBe(3);
  });
});
