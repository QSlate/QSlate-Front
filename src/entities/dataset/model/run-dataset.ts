import type { MarketSymbol } from '@/shared/api';

export type RunDatasetSource = 'public' | 'custom';

/** A dataset version a backtest can run on (GET /data/symbols). */
export interface RunDataset {
  /** Dataset id (`public-*` for the bundled catalogue). */
  readonly id: string;
  readonly versionId: string;
  readonly name: string;
  /** Market data symbol, e.g. `ETH/USDT@1h` or `custom:<id>`. */
  readonly symbol: string;
  readonly resolution: '1h' | '1d' | null;
  readonly source: RunDatasetSource;
}

const PUBLIC_PREFIX = 'public-';

/**
 * Keeps the symbols backed by a runnable dataset version, public catalogue
 * first (the composer defaults to the first one).
 */
export function toRunDatasets(
  symbols: readonly MarketSymbol[]
): readonly RunDataset[] {
  const datasets = symbols.flatMap((symbol) =>
    symbol.dataset_id && symbol.version_id
      ? [
          {
            id: symbol.dataset_id,
            versionId: symbol.version_id,
            name: symbol.name || symbol.symbol,
            symbol: symbol.symbol,
            resolution: symbol.resolution ?? null,
            source: symbol.dataset_id.startsWith(PUBLIC_PREFIX)
              ? 'public'
              : 'custom',
          } satisfies RunDataset,
        ]
      : []
  );
  return [
    ...datasets.filter((dataset) => dataset.source === 'public'),
    ...datasets.filter((dataset) => dataset.source === 'custom'),
  ];
}

/** "ETH / USDT · 1 h" style label of a dataset. */
export function formatDatasetLabel(dataset: RunDataset): string {
  const base = dataset.symbol.startsWith('custom:')
    ? dataset.name
    : (dataset.symbol.split('@')[0] ?? dataset.symbol).replace('/', ' / ');
  if (!dataset.resolution) return base;
  return `${base} · ${dataset.resolution === '1h' ? '1 h' : '1 j'}`;
}
