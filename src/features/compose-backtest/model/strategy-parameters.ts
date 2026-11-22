import type { StrategyParameterValue } from '@/entities/backtest';

export type ParameterKind = 'number' | 'boolean' | 'string';

export interface ParameterField {
  readonly key: string;
  readonly kind: ParameterKind;
  readonly defaultValue: StrategyParameterValue;
}

function kindOf(value: unknown): ParameterKind | null {
  if (typeof value === 'number' && Number.isFinite(value)) return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') return 'string';
  return null;
}

function isParameterValue(value: unknown): value is StrategyParameterValue {
  return kindOf(value) !== null;
}

/**
 * Editable fields of a strategy, typed by their saved default value. Keys
 * whose default is not a scalar (objects, arrays, null) are not editable.
 */
export function describeParameters(
  defaults: Readonly<Record<string, unknown>>
): readonly ParameterField[] {
  return Object.entries(defaults).flatMap(([key, value]) => {
    const kind = kindOf(value);
    return kind !== null && isParameterValue(value)
      ? [{ key, kind, defaultValue: value }]
      : [];
  });
}

/**
 * Overrides that really change something: same type as the default, known
 * key, and a different value. Anything else is dropped.
 */
export function effectiveOverrides(
  defaults: Readonly<Record<string, unknown>>,
  overrides: Readonly<Record<string, StrategyParameterValue>>
): Record<string, StrategyParameterValue> {
  const result: Record<string, StrategyParameterValue> = {};
  for (const field of describeParameters(defaults)) {
    const value = overrides[field.key];
    if (value === undefined || kindOf(value) !== field.kind) continue;
    if (value !== field.defaultValue) result[field.key] = value;
  }
  return result;
}

export { isParameterValue };
