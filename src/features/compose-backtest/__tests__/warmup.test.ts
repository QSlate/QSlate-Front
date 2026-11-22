import { describe, expect, it } from 'vitest';

import { describeParameters } from '../model/strategy-parameters';
import { warmupShortfall } from '../model/warmup';

const FIELDS = describeParameters({
  fast_period: 50,
  slowPeriod: 200,
  threshold: 300,
  label: 'x',
});

describe('warmupShortfall', () => {
  it('reports the longest period parameter above the window', () => {
    expect(warmupShortfall(20, FIELDS, {})).toEqual({
      parameter: 'Slow period',
      period: 200,
    });
  });

  it('uses overrides and ignores non-period parameters', () => {
    expect(warmupShortfall(200, FIELDS, { fast_period: 250 })).toEqual({
      parameter: 'Fast period',
      period: 250,
    });
    expect(warmupShortfall(250, FIELDS, {})).toBeNull();
  });

  it('stays silent without a window', () => {
    expect(warmupShortfall(null, FIELDS, {})).toBeNull();
  });
});
