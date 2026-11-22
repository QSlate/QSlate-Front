/** Test period choices of the run composer. */
export type PeriodPreset = 'all' | '1y' | '6m' | '3m' | 'custom';

export const PERIOD_PRESETS: readonly PeriodPreset[] = [
  'all',
  '1y',
  '6m',
  '3m',
  'custom',
];

export const PERIOD_LABELS: Readonly<Record<PeriodPreset, string>> = {
  all: 'Tout',
  '1y': '1 an',
  '6m': '6 mois',
  '3m': '3 mois',
  custom: 'Personnalisée',
};

/** Longest period accepted by the lab service (end exclusive). */
export const MAX_PERIOD_DAYS = 366;
const DAY_MS = 86_400_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface PeriodSelection {
  readonly preset: PeriodPreset;
  /** Custom first day (YYYY-MM-DD, inclusive). */
  readonly start: string | null;
  /** Custom last day (YYYY-MM-DD, inclusive). */
  readonly end: string | null;
}

export type PeriodResolution =
  | {
      readonly ok: true;
      readonly start: string | null;
      readonly end: string | null;
    }
  | { readonly ok: false; readonly error: string; readonly pending?: boolean };

export function isPeriodPreset(value: unknown): value is PeriodPreset {
  return PERIOD_PRESETS.some((preset) => preset === value);
}

/** Parses a YYYY-MM-DD day as UTC midnight; null when invalid. */
export function parseDay(value: string | null): number | null {
  if (!value || !DATE_PATTERN.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(time)) return null;
  return new Date(time).toISOString().slice(0, 10) === value ? time : null;
}

function iso(time: number): string {
  return new Date(time).toISOString().replace('.000Z', 'Z');
}

function monthsBefore(time: number, months: number): number {
  const date = new Date(time);
  date.setUTCMonth(date.getUTCMonth() - months);
  return date.getTime();
}

/**
 * Turns the period choice into the run's `period_start`/`period_end`
 * (UTC, end exclusive). Relative presets end after the dataset's last
 * candle (`coverageEnd`), which must be known; "Tout" sends no period.
 */
export function resolvePeriod(
  period: PeriodSelection,
  coverageEnd: string | null | undefined
): PeriodResolution {
  if (period.preset === 'all') return { ok: true, start: null, end: null };
  if (period.preset === 'custom') {
    const start = parseDay(period.start);
    const lastDay = parseDay(period.end);
    if (start === null || lastDay === null) {
      return { ok: false, error: 'Choisis une date de début et de fin.' };
    }
    const end = lastDay + DAY_MS;
    if (end <= start) {
      return {
        ok: false,
        error: 'La date de fin doit suivre la date de début.',
      };
    }
    if (end - start > MAX_PERIOD_DAYS * DAY_MS) {
      return {
        ok: false,
        error: `La période ne peut pas dépasser ${MAX_PERIOD_DAYS} jours.`,
      };
    }
    return { ok: true, start: iso(start), end: iso(end) };
  }
  if (coverageEnd === undefined) {
    return {
      ok: false,
      pending: true,
      error: 'Calcul de la période des données…',
    };
  }
  const last = coverageEnd === null ? Number.NaN : Date.parse(coverageEnd);
  if (!Number.isFinite(last)) {
    return {
      ok: false,
      error:
        'Dates des données inconnues : choisis « Tout » ou une période personnalisée.',
    };
  }
  const end = Math.floor(last / DAY_MS) * DAY_MS + DAY_MS;
  const start =
    period.preset === '1y'
      ? end - 365 * DAY_MS
      : monthsBefore(end, period.preset === '6m' ? 6 : 3);
  return { ok: true, start: iso(start), end: iso(end) };
}
