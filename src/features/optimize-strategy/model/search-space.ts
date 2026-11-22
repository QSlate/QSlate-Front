/** Lab default cap on trials per optimization (configurable server side). */
export const MAX_OPTIMIZATION_TRIALS = 25;

export type OptimizationMethod = 'grid_search' | 'monte_carlo';

/** One numeric parameter to explore. */
export interface ParameterRange {
  readonly key: string;
  readonly min: number;
  readonly max: number;
  /** Number of evenly spaced values, min and max included. */
  readonly steps: number;
  readonly integer: boolean;
}

/** Evenly spaced values of a range (deduplicated after rounding). */
export function rangeValues(range: ParameterRange): number[] {
  const steps = Math.max(1, Math.floor(range.steps));
  if (steps === 1 || range.max === range.min) return [range.min];
  const values = Array.from({ length: steps }, (_, index) => {
    const raw = range.min + ((range.max - range.min) * index) / (steps - 1);
    return range.integer ? Math.round(raw) : Number(raw.toPrecision(10));
  });
  return [...new Set(values)];
}

export function buildSearchSpace(
  ranges: readonly ParameterRange[]
): Record<string, number[]> {
  return Object.fromEntries(
    ranges.map((range) => [range.key, rangeValues(range)])
  );
}

/** Number of combinations a grid search would run. */
export function gridSize(
  space: Readonly<Record<string, readonly number[]>>
): number {
  return Object.values(space).reduce(
    (total, values) => total * values.length,
    1
  );
}

/** French error for an invalid range, or null. */
export function validateRange(range: ParameterRange): string | null {
  if (!Number.isFinite(range.min) || !Number.isFinite(range.max))
    return 'Bornes invalides.';
  if (range.min > range.max) return 'Le minimum dépasse le maximum.';
  if (!Number.isInteger(range.steps) || range.steps < 1 || range.steps > 10) {
    return 'Entre 1 et 10 valeurs.';
  }
  return null;
}

/** Why the optimization cannot start, or null. */
export function validateOptimization(
  method: OptimizationMethod,
  ranges: readonly ParameterRange[],
  maxRuns: number
): string | null {
  if (ranges.length === 0) return 'Choisis au moins un paramètre à explorer.';
  const invalid = ranges.map(validateRange).find((error) => error !== null);
  if (invalid) return invalid;
  if (
    !Number.isInteger(maxRuns) ||
    maxRuns < 1 ||
    maxRuns > MAX_OPTIMIZATION_TRIALS
  ) {
    return `Entre 1 et ${MAX_OPTIMIZATION_TRIALS} essais.`;
  }
  const size = gridSize(buildSearchSpace(ranges));
  if (method === 'grid_search' && size > maxRuns) {
    return `La grille compte ${size} combinaisons : réduis les valeurs ou passe en tirage aléatoire.`;
  }
  return null;
}
