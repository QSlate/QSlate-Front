export type TimestampUnit = 'iso8601' | 's' | 'ms' | 'us' | 'ns';

export const TIMESTAMP_UNITS: readonly TimestampUnit[] = [
  'iso8601',
  's',
  'ms',
  'us',
  'ns',
];

export const TIMESTAMP_UNIT_LABELS: Readonly<Record<TimestampUnit, string>> = {
  iso8601: 'Date ISO 8601',
  s: 'Secondes Unix',
  ms: 'Millisecondes Unix',
  us: 'Microsecondes Unix',
  ns: 'Nanosecondes Unix',
};

export type MappedField =
  'timestamp' | 'open' | 'high' | 'low' | 'close' | 'volume';

export const MAPPED_FIELDS: readonly MappedField[] = [
  'timestamp',
  'open',
  'high',
  'low',
  'close',
  'volume',
];

export const FIELD_LABELS: Readonly<Record<MappedField, string>> = {
  timestamp: 'Date',
  open: 'Ouverture',
  high: 'Plus haut',
  low: 'Plus bas',
  close: 'Clôture',
  volume: 'Volume (optionnel)',
};

export interface ColumnMappingDraft {
  readonly fields: Readonly<Record<MappedField, string | null>>;
  readonly unit: TimestampUnit;
}

const PATTERNS: Readonly<Record<MappedField, RegExp>> = {
  timestamp: /^(timestamp|time|date|datetime|ts|open_?time|date_?time)$/,
  open: /^(o|open|open_?price|ouverture)$/,
  high: /^(h|high|high_?price|haut|plus_?haut)$/,
  low: /^(l|low|low_?price|bas|plus_?bas)$/,
  close: /^(c|close|close_?price|cloture|clôture|adj_?close)$/,
  volume: /^(v|vol|volume|base_?volume)$/,
};

function normalize(column: string): string {
  return column
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

/** Guesses the unit of a timestamp sample ("1710806400" → seconds). */
export function detectTimestampUnit(sample: string | undefined): TimestampUnit {
  const value = sample?.trim() ?? '';
  if (/^\d+$/.test(value)) {
    if (value.length <= 10) return 's';
    if (value.length <= 13) return 'ms';
    if (value.length <= 16) return 'us';
    return 'ns';
  }
  return 'iso8601';
}

/**
 * Maps the file's columns to candle fields by their usual names, and the
 * timestamp unit from the first preview row. Unknown fields stay null.
 */
export function detectColumnMapping(
  columns: readonly string[],
  preview: readonly (readonly string[])[] = []
): ColumnMappingDraft {
  const used = new Set<string>();
  const pick = (field: MappedField): string | null => {
    const match = columns.find(
      (column) => !used.has(column) && PATTERNS[field].test(normalize(column))
    );
    if (match) used.add(match);
    return match ?? null;
  };
  const fields: Record<MappedField, string | null> = {
    timestamp: pick('timestamp'),
    open: pick('open'),
    high: pick('high'),
    low: pick('low'),
    close: pick('close'),
    volume: pick('volume'),
  };
  const timestampIndex = fields.timestamp
    ? columns.indexOf(fields.timestamp)
    : -1;
  const firstRow = preview.find((row) => row.length === columns.length);
  return {
    fields,
    unit: detectTimestampUnit(
      timestampIndex >= 0 ? firstRow?.[timestampIndex] : undefined
    ),
  };
}

/** Required fields still missing, in display order. */
export function missingFields(
  draft: ColumnMappingDraft
): readonly MappedField[] {
  return MAPPED_FIELDS.filter(
    (field) => field !== 'volume' && draft.fields[field] === null
  );
}
