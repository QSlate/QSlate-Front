import type { BacktestRunRequest } from '@/entities/backtest';

const ACTIVE_RUN_STORAGE_KEY = 'qslate_active_backtest';

/** A job accepted by the server that this browser is following. */
export interface PersistedActiveRun {
  readonly backtestId: string;
  readonly request: BacktestRunRequest | null;
  readonly startedAt: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRunRequest(value: unknown): value is BacktestRunRequest {
  return (
    isRecord(value) &&
    typeof value.strategyId === 'string' &&
    typeof value.strategyVersionId === 'string' &&
    typeof value.datasetId === 'string' &&
    typeof value.datasetVersionId === 'string' &&
    typeof value.initialCapital === 'number' &&
    isRecord(value.parameters) &&
    typeof value.window === 'number' &&
    typeof value.commissionRate === 'number' &&
    typeof value.slippageBps === 'number'
  );
}

export function persistActiveRun(run: PersistedActiveRun): void {
  try {
    localStorage.setItem(ACTIVE_RUN_STORAGE_KEY, JSON.stringify(run));
  } catch {
    // Without storage the run simply cannot be re-attached after a reload.
  }
}

export function clearActiveRun(): void {
  try {
    localStorage.removeItem(ACTIVE_RUN_STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** The persisted active run, or null when absent or corrupted. */
export function readActiveRun(): PersistedActiveRun | null {
  try {
    const raw = localStorage.getItem(ACTIVE_RUN_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      isRecord(parsed) &&
      typeof parsed.backtestId === 'string' &&
      parsed.backtestId &&
      typeof parsed.startedAt === 'number'
    ) {
      return {
        backtestId: parsed.backtestId,
        startedAt: parsed.startedAt,
        request: isRunRequest(parsed.request) ? parsed.request : null,
      };
    }
  } catch {
    // Corrupted entry: ignore it.
  }
  clearActiveRun();
  return null;
}
