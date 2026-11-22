import { describe, expect, it } from 'vitest';

import { formatDecimal, formatSignedPercent } from '../model/format';

describe('result formatters', () => {
  it('uses the French decimal comma', () => {
    expect(formatDecimal(18.44)).toBe('18,4');
    expect(formatDecimal(3)).toBe('3,0');
    expect(formatSignedPercent(-3.21)).toBe('▼ −3,2 %');
  });
});
