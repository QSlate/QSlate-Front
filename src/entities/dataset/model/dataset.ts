import type { CustomDataset } from '@/shared/api';

/** Only datasets whose current version finished indexing can be backtested. */
export function isRunnableDataset(dataset: CustomDataset): boolean {
  return dataset.status === 'ready' && Boolean(dataset.version_id);
}

const CANDLE_COUNT_FORMATTER = new Intl.NumberFormat('fr-FR');

/** "2 190 bougies" — candle count shown next to a dataset name. */
export function formatCandleCount(rowCount: number): string {
  const count = Math.max(0, Math.trunc(rowCount));
  return `${CANDLE_COUNT_FORMATTER.format(count)} ${count > 1 ? 'bougies' : 'bougie'}`;
}
