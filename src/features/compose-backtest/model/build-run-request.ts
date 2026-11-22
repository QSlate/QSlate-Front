import {
  type BacktestRunRequest,
  RUN_LIMITS,
  type StrategyParameterValue,
} from '@/entities/backtest';
import type { CustomDataset, StrategySummary } from '@/shared/api';

import type { ComposerSelection } from './composer-store';
import { commissionPercentToRate } from './cost-units';
import { effectiveOverrides } from './strategy-parameters';

export type ComposerField =
  'capital' | 'commissionPercent' | 'slippageBps' | 'window';

const COMPOSER_FIELDS: readonly ComposerField[] = [
  'capital',
  'commissionPercent',
  'slippageBps',
  'window',
];

export type ComposerFieldErrors = Partial<Record<ComposerField, string>>;

/** Why "Lancer" is unavailable; the UI explains each one with a next step. */
export type RunBlocker =
  | { readonly kind: 'no-strategy' }
  | { readonly kind: 'no-dataset' }
  | { readonly kind: 'invalid-field'; readonly field: ComposerField };

export type BuildRunRequestResult =
  | { readonly ok: true; readonly request: BacktestRunRequest }
  | { readonly ok: false; readonly blockers: readonly RunBlocker[] };

export interface BuildRunRequestInput {
  readonly selection: ComposerSelection;
  readonly strategies: readonly StrategySummary[];
  readonly datasets: readonly CustomDataset[];
  /** Saved parameters of the selected strategy when already loaded. */
  readonly strategyDefaults: Readonly<Record<string, unknown>> | null;
}

const CAPITAL_FORMATTER = new Intl.NumberFormat('fr-FR');

/** Selected strategy, or the first one when none (or a deleted one) is set. */
export function resolveStrategy(
  selection: ComposerSelection,
  strategies: readonly StrategySummary[]
): StrategySummary | null {
  return (
    strategies.find((strategy) => strategy.id === selection.strategyId) ??
    strategies[0] ??
    null
  );
}

/** Selected runnable dataset, or the first runnable one. */
export function resolveDataset(
  selection: ComposerSelection,
  datasets: readonly CustomDataset[]
): CustomDataset | null {
  return (
    datasets.find((dataset) => dataset.id === selection.datasetId) ??
    datasets[0] ??
    null
  );
}

function inRange(value: number | null, min: number, max: number) {
  return (
    value !== null && Number.isFinite(value) && value >= min && value <= max
  );
}

/** French, field-level validation of the composer and advanced settings. */
export function validateComposerFields(
  selection: ComposerSelection
): ComposerFieldErrors {
  const errors: ComposerFieldErrors = {};
  const { capital, commissionPercent, slippageBps, window } = selection;
  if (capital === null || !Number.isFinite(capital) || capital <= 0) {
    errors.capital = 'Le capital doit être supérieur à 0.';
  } else if (capital > RUN_LIMITS.initialCapital.max) {
    errors.capital = `Le capital ne peut pas dépasser ${CAPITAL_FORMATTER.format(
      RUN_LIMITS.initialCapital.max
    )} USD.`;
  }
  const maxPercent = RUN_LIMITS.commissionRate.max * 100;
  if (!inRange(commissionPercent, 0, maxPercent)) {
    errors.commissionPercent = `Les frais doivent être compris entre 0 et ${maxPercent} %.`;
  }
  if (!inRange(slippageBps, 0, RUN_LIMITS.slippageBps.max)) {
    errors.slippageBps = `Le glissement doit être compris entre 0 et ${CAPITAL_FORMATTER.format(
      RUN_LIMITS.slippageBps.max
    )} pb.`;
  }
  if (
    !inRange(window, RUN_LIMITS.window.min, RUN_LIMITS.window.max) ||
    !Number.isInteger(window)
  ) {
    errors.window = `L'historique de chauffe doit être un entier entre ${RUN_LIMITS.window.min} et ${CAPITAL_FORMATTER.format(
      RUN_LIMITS.window.max
    )} bougies.`;
  }
  return errors;
}

/** Parameter overrides that apply to the selected strategy. */
export function overridesFor(
  selection: ComposerSelection,
  strategyId: string,
  defaults: Readonly<Record<string, unknown>> | null
): Record<string, StrategyParameterValue> {
  const raw = selection.parameterOverrides[strategyId] ?? {};
  // Without the saved defaults we cannot tell what changed: send nothing
  // rather than guessing, the backend then uses the saved values.
  return defaults ? effectiveOverrides(defaults, raw) : {};
}

/** Number of advanced settings that differ from their defaults. */
export function countAdvancedChanges(
  selection: ComposerSelection,
  strategyId: string | null,
  defaults: Readonly<Record<string, unknown>> | null
): number {
  const params =
    strategyId === null
      ? 0
      : Object.keys(overridesFor(selection, strategyId, defaults)).length;
  return (
    params +
    Number(selection.commissionPercent !== RUN_LIMITS.commissionRate.default) +
    Number(selection.slippageBps !== RUN_LIMITS.slippageBps.default) +
    Number(selection.window !== RUN_LIMITS.window.default)
  );
}

/**
 * Turns the composer state into a run request, or lists every reason why
 * the run cannot start yet. Pure: no I/O, no store access.
 */
export function buildRunRequest({
  selection,
  strategies,
  datasets,
  strategyDefaults,
}: BuildRunRequestInput): BuildRunRequestResult {
  const blockers: RunBlocker[] = [];
  const strategy = resolveStrategy(selection, strategies);
  const dataset = resolveDataset(selection, datasets);
  if (!strategy) blockers.push({ kind: 'no-strategy' });
  if (!dataset) blockers.push({ kind: 'no-dataset' });
  const errors = validateComposerFields(selection);
  for (const field of COMPOSER_FIELDS) {
    if (errors[field]) blockers.push({ kind: 'invalid-field', field });
  }
  if (
    !strategy ||
    !dataset ||
    blockers.length > 0 ||
    selection.capital === null ||
    selection.commissionPercent === null ||
    selection.slippageBps === null ||
    selection.window === null
  ) {
    return { ok: false, blockers };
  }
  return {
    ok: true,
    request: {
      strategyId: strategy.id,
      strategyVersionId: strategy.version_id,
      datasetId: dataset.id,
      datasetVersionId: dataset.version_id,
      initialCapital: selection.capital,
      parameters: overridesFor(selection, strategy.id, strategyDefaults),
      window: selection.window,
      commissionRate: commissionPercentToRate(selection.commissionPercent),
      slippageBps: selection.slippageBps,
    },
  };
}
