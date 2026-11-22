import { describe, expect, it } from 'vitest';

import {
  detectColumnMapping,
  detectTimestampUnit,
  missingFields,
} from '../model/column-detection';

describe('column detection', () => {
  it('maps the usual candle column names', () => {
    const draft = detectColumnMapping(
      ['Open Time', 'Open', 'High', 'Low', 'Close', 'Volume'],
      [['1710806400000', '1', '2', '0.5', '1.5', '10']]
    );
    expect(draft.fields).toEqual({
      timestamp: 'Open Time',
      open: 'Open',
      high: 'High',
      low: 'Low',
      close: 'Close',
      volume: 'Volume',
    });
    expect(draft.unit).toBe('ms');
    expect(missingFields(draft)).toEqual([]);
  });

  it('reports what it could not recognise', () => {
    const draft = detectColumnMapping(['when', 'o', 'h', 'l', 'c']);
    expect(draft.fields.volume).toBeNull();
    expect(missingFields(draft)).toEqual(['timestamp']);
  });

  it('detects timestamp units', () => {
    expect(detectTimestampUnit('1710806400')).toBe('s');
    expect(detectTimestampUnit('2024-03-19T00:00:00Z')).toBe('iso8601');
    expect(detectTimestampUnit('1710806400000000000')).toBe('ns');
  });
});
