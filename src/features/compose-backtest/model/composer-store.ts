'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { RUN_LIMITS, type StrategyParameterValue } from '@/entities/backtest';
import { useHydratedStore } from '@/shared/lib/store';

import { isParameterValue } from './strategy-parameters';

export const COMPOSER_STORAGE_KEY = 'qslate_backtest_composer';
const COMPOSER_STORAGE_VERSION = 1;

export const DEFAULT_CAPITAL_USD = 10_000;

/** What the user picked in the run composer (one per signed-in user). */
export interface ComposerSelection {
  readonly strategyId: string | null;
  readonly datasetId: string | null;
  /** Initial capital in USD; `null` while the field is empty. */
  readonly capital: number | null;
  /** Fee per trade in percent of the notional (0.1 = 0,10 %). */
  readonly commissionPercent: number | null;
  readonly slippageBps: number | null;
  readonly window: number | null;
  /** Parameter overrides, keyed by strategy id then parameter name. */
  readonly parameterOverrides: Readonly<
    Record<string, Readonly<Record<string, StrategyParameterValue>>>
  >;
}

export const DEFAULT_COMPOSER_SELECTION: ComposerSelection = {
  strategyId: null,
  datasetId: null,
  capital: DEFAULT_CAPITAL_USD,
  commissionPercent: RUN_LIMITS.commissionRate.default * 100,
  slippageBps: RUN_LIMITS.slippageBps.default,
  window: RUN_LIMITS.window.default,
  parameterOverrides: {},
};

export type ComposerPatch = Partial<
  Pick<
    ComposerSelection,
    | 'strategyId'
    | 'datasetId'
    | 'capital'
    | 'commissionPercent'
    | 'slippageBps'
    | 'window'
  >
>;

interface ComposerState {
  readonly selections: Readonly<Record<string, ComposerSelection>>;
  update: (userKey: string, patch: ComposerPatch) => void;
  setParameter: (
    userKey: string,
    strategyId: string,
    key: string,
    value: StrategyParameterValue | null
  ) => void;
  /** Restores costs, warm-up and the strategy's parameters to defaults. */
  resetAdvanced: (userKey: string, strategyId: string | null) => void;
}

function selectionOf(
  selections: Readonly<Record<string, ComposerSelection>>,
  userKey: string
): ComposerSelection {
  return selections[userKey] ?? DEFAULT_COMPOSER_SELECTION;
}

function nullableNumber(value: unknown, fallback: number | null) {
  if (value === null) return null;
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validates a persisted selection, falling back to defaults per field. */
export function sanitizeSelection(value: unknown): ComposerSelection {
  if (!isRecord(value)) return DEFAULT_COMPOSER_SELECTION;
  const overrides: Record<string, Record<string, StrategyParameterValue>> = {};
  if (isRecord(value.parameterOverrides)) {
    for (const [strategyId, params] of Object.entries(
      value.parameterOverrides
    )) {
      if (!isRecord(params)) continue;
      const clean: Record<string, StrategyParameterValue> = {};
      for (const [key, param] of Object.entries(params)) {
        if (isParameterValue(param)) clean[key] = param;
      }
      overrides[strategyId] = clean;
    }
  }
  const defaults = DEFAULT_COMPOSER_SELECTION;
  return {
    strategyId: nullableString(value.strategyId),
    datasetId: nullableString(value.datasetId),
    capital: nullableNumber(value.capital, defaults.capital),
    commissionPercent: nullableNumber(
      value.commissionPercent,
      defaults.commissionPercent
    ),
    slippageBps: nullableNumber(value.slippageBps, defaults.slippageBps),
    window: nullableNumber(value.window, defaults.window),
    parameterOverrides: overrides,
  };
}

function sanitizeSelections(value: unknown): Record<string, ComposerSelection> {
  if (!isRecord(value) || !isRecord(value.selections)) return {};
  return Object.fromEntries(
    Object.entries(value.selections).map(([userKey, selection]) => [
      userKey,
      sanitizeSelection(selection),
    ])
  );
}

export const useComposerStore = create<ComposerState>()(
  persist(
    (set) => ({
      selections: {},
      update: (userKey, patch) =>
        set((state) => ({
          selections: {
            ...state.selections,
            [userKey]: { ...selectionOf(state.selections, userKey), ...patch },
          },
        })),
      setParameter: (userKey, strategyId, key, value) =>
        set((state) => {
          const current = selectionOf(state.selections, userKey);
          const nextParams = Object.fromEntries(
            Object.entries(current.parameterOverrides[strategyId] ?? {}).filter(
              ([name]) => name !== key
            )
          );
          if (value !== null) nextParams[key] = value;
          return {
            selections: {
              ...state.selections,
              [userKey]: {
                ...current,
                parameterOverrides: {
                  ...current.parameterOverrides,
                  [strategyId]: nextParams,
                },
              },
            },
          };
        }),
      resetAdvanced: (userKey, strategyId) =>
        set((state) => {
          const current = selectionOf(state.selections, userKey);
          const overrides = { ...current.parameterOverrides };
          if (strategyId !== null) delete overrides[strategyId];
          return {
            selections: {
              ...state.selections,
              [userKey]: {
                ...current,
                commissionPercent: DEFAULT_COMPOSER_SELECTION.commissionPercent,
                slippageBps: DEFAULT_COMPOSER_SELECTION.slippageBps,
                window: DEFAULT_COMPOSER_SELECTION.window,
                parameterOverrides: overrides,
              },
            },
          };
        }),
    }),
    {
      name: COMPOSER_STORAGE_KEY,
      version: COMPOSER_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selections: state.selections }),
      merge: (persisted, current) => ({
        ...current,
        selections: sanitizeSelections(persisted),
      }),
    }
  )
);

/**
 * The current user's selection. Returns the defaults during SSR and the
 * first client render so server and client markup match.
 */
export function useComposerSelection(userKey: string): ComposerSelection {
  return useHydratedStore(
    useComposerStore,
    (state) => selectionOf(state.selections, userKey),
    DEFAULT_COMPOSER_SELECTION
  );
}
