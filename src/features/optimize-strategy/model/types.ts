export interface ParameterRange {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
}

export interface OptimizationTrial {
  id: string;
  trialNumber: number;
  parameters: Record<string, number>;
  metrics: {
    sharpe: number;
    totalReturn: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
  };
  status: 'pending' | 'running' | 'completed' | 'failed';
}

/**
 * Generates an array of discrete float values between min and max with the given step.
 * Caps at 100 values to conform to backend search space constraints.
 */
export function generateParameterValues(
  min: number,
  max: number,
  step: number
): number[] {
  if (step <= 0 || min > max) return [min];
  const values: number[] = [];
  const decimals = (step.toString().split('.')[1] || '').length;

  for (let v = min; v <= max + step * 0.001; v += step) {
    values.push(Number(v.toFixed(decimals)));
    if (values.length >= 100) break;
  }
  return values;
}

/**
 * Calculates the total Cartesian permutations across parameter ranges.
 */
export function calculateTotalPermutations(params: ParameterRange[]): number {
  if (params.length === 0) return 0;
  return params.reduce((acc, p) => {
    const count = generateParameterValues(p.min, p.max, p.step).length;
    return acc * (count > 0 ? count : 1);
  }, 1);
}

export const DEFAULT_OPTIMIZATION_PARAMETERS: ParameterRange[] = [
  {
    id: 'param-1',
    name: 'fast_period',
    min: 10,
    max: 20,
    step: 5,
  },
  {
    id: 'param-2',
    name: 'slow_period',
    min: 30,
    max: 50,
    step: 10,
  },
];
