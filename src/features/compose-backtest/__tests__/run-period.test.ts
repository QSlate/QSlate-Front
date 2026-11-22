import { describe, expect, it } from 'vitest';

import { parseDay, resolvePeriod } from '../model/run-period';

describe('resolvePeriod', () => {
  it('sends no period for "Tout"', () => {
    expect(
      resolvePeriod({ preset: 'all', start: null, end: null }, undefined)
    ).toEqual({
      ok: true,
      start: null,
      end: null,
    });
  });

  it('anchors relative presets after the last candle', () => {
    const last = '2025-03-18T00:00:00Z';
    expect(
      resolvePeriod({ preset: '1y', start: null, end: null }, last)
    ).toEqual({
      ok: true,
      start: '2024-03-19T00:00:00Z',
      end: '2025-03-19T00:00:00Z',
    });
    expect(
      resolvePeriod({ preset: '3m', start: null, end: null }, last)
    ).toEqual({
      ok: true,
      start: '2024-12-19T00:00:00Z',
      end: '2025-03-19T00:00:00Z',
    });
  });

  it('waits for, or reports, an unknown coverage', () => {
    const pending = resolvePeriod(
      { preset: '6m', start: null, end: null },
      undefined
    );
    expect(pending).toMatchObject({ ok: false, pending: true });
    expect(
      resolvePeriod({ preset: '6m', start: null, end: null }, null).ok
    ).toBe(false);
  });

  it('validates custom periods (order, 366 days, end inclusive)', () => {
    expect(
      resolvePeriod(
        { preset: 'custom', start: '2024-05-01', end: '2024-05-31' },
        null
      )
    ).toEqual({
      ok: true,
      start: '2024-05-01T00:00:00Z',
      end: '2024-06-01T00:00:00Z',
    });
    expect(
      resolvePeriod(
        { preset: 'custom', start: '2024-05-31', end: '2024-05-01' },
        null
      ).ok
    ).toBe(false);
    expect(
      resolvePeriod(
        { preset: 'custom', start: '2023-01-01', end: '2024-06-01' },
        null
      ).ok
    ).toBe(false);
    expect(
      resolvePeriod({ preset: 'custom', start: null, end: null }, null).ok
    ).toBe(false);
  });

  it('rejects impossible days', () => {
    expect(parseDay('2024-02-30')).toBeNull();
    expect(parseDay('2024-02-29')).not.toBeNull();
  });
});
