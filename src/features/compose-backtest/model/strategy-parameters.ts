import type { StrategyParameterValue } from '@/entities/backtest';
import type { StrategyParameterSchema } from '@/shared/api';

export type ParameterKind = 'number' | 'boolean' | 'string';

export interface ParameterField {
  readonly key: string;
  readonly kind: ParameterKind;
  readonly defaultValue: StrategyParameterValue;
  /** Human label derived from the key ("RSI period"). */
  readonly label: string;
  readonly description: string | null;
  /** Whole numbers only (schema type `integer`). */
  readonly integer: boolean;
  readonly min: number | null;
  readonly max: number | null;
}

const ACRONYMS = new Set([
  'rsi',
  'sma',
  'ema',
  'wma',
  'macd',
  'atr',
  'adx',
  'usd',
  'id',
  'bb',
  'vwap',
]);

/** "rsi_period" → "RSI period", "takeProfitPct" → "Take profit (%)". */
export function humanizeParameterName(name: string): string {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
  const hasPercent = words.at(-1) === 'pct' || words.at(-1) === 'percent';
  const text = (hasPercent ? words.slice(0, -1) : words)
    .map((word) => (ACRONYMS.has(word) ? word.toUpperCase() : word))
    .join(' ');
  const label = text.charAt(0).toUpperCase() + text.slice(1);
  return hasPercent ? `${label} (%)` : label;
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

function finiteOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function inferredField(
  key: string,
  value: StrategyParameterValue
): ParameterField | null {
  const kind = kindOf(value);
  return kind === null
    ? null
    : {
        key,
        kind,
        defaultValue: value,
        label: humanizeParameterName(key),
        description: null,
        integer: false,
        min: null,
        max: null,
      };
}

function schemaField(
  entry: StrategyParameterSchema,
  saved: unknown
): ParameterField | null {
  const kind: ParameterKind =
    entry.type === 'integer' || entry.type === 'number' ? 'number' : entry.type;
  const fallback = isParameterValue(saved) ? saved : entry.default;
  if (!isParameterValue(fallback) || kindOf(fallback) !== kind) return null;
  return {
    key: entry.name,
    kind,
    defaultValue: fallback,
    label: humanizeParameterName(entry.name),
    description: entry.description || null,
    integer: entry.type === 'integer',
    min: kind === 'number' ? finiteOrNull(entry.min) : null,
    max: kind === 'number' ? finiteOrNull(entry.max) : null,
  };
}

/**
 * Editable fields of a strategy. With a declared `parameter_schema`, its
 * entries define types, bounds and descriptions (saved values win as
 * defaults); otherwise types are inferred from the saved scalar values.
 */
export function describeParameters(
  defaults: Readonly<Record<string, unknown>>,
  schema: readonly StrategyParameterSchema[] = []
): readonly ParameterField[] {
  if (schema.length > 0) {
    return schema.flatMap((entry) => {
      const field = schemaField(entry, defaults[entry.name]);
      return field ? [field] : [];
    });
  }
  return Object.entries(defaults).flatMap(([key, value]) => {
    const field = isParameterValue(value) ? inferredField(key, value) : null;
    return field ? [field] : [];
  });
}

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 });

/** French error for a value that breaks the declared constraints. */
export function validateParameterValue(
  field: ParameterField,
  value: StrategyParameterValue
): string | null {
  if (field.kind !== 'number' || typeof value !== 'number') return null;
  if (!Number.isFinite(value)) return 'Saisis un nombre.';
  if (field.integer && !Number.isInteger(value)) {
    return 'Saisis un nombre entier.';
  }
  if (field.min !== null && value < field.min) {
    return `Minimum ${NUMBER.format(field.min)}.`;
  }
  if (field.max !== null && value > field.max) {
    return `Maximum ${NUMBER.format(field.max)}.`;
  }
  return null;
}

/**
 * Overrides that really change something: same type as the default, known
 * key, and a different value. Anything else is dropped.
 */
export function effectiveOverrides(
  defaults: Readonly<Record<string, unknown>>,
  overrides: Readonly<Record<string, StrategyParameterValue>>,
  schema: readonly StrategyParameterSchema[] = []
): Record<string, StrategyParameterValue> {
  const result: Record<string, StrategyParameterValue> = {};
  for (const field of describeParameters(defaults, schema)) {
    const value = overrides[field.key];
    if (value === undefined || kindOf(value) !== field.kind) continue;
    if (value !== field.defaultValue) result[field.key] = value;
  }
  return result;
}

/** Overrides that break the schema, keyed by parameter name. */
export function parameterErrors(
  defaults: Readonly<Record<string, unknown>>,
  overrides: Readonly<Record<string, StrategyParameterValue>>,
  schema: readonly StrategyParameterSchema[] = []
): Readonly<Record<string, string>> {
  const errors: Record<string, string> = {};
  for (const field of describeParameters(defaults, schema)) {
    const value = overrides[field.key];
    if (value === undefined) continue;
    const error = validateParameterValue(field, value);
    if (error) errors[field.key] = error;
  }
  return errors;
}

export { isParameterValue };
