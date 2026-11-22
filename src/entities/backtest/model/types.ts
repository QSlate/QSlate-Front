import type { BacktestResult } from './result';
import type { BacktestRunRequest } from './run-request';

export type BacktestJobStatus =
  'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

/** Latest known state of a server-side backtest job. */
export interface BacktestJobSnapshot {
  readonly backtestId: string;
  readonly status: BacktestJobStatus;
  /** Completion percentage 0–100 when the server reports it. */
  readonly progress: number | null;
  /** Server error detail for failed jobs. */
  readonly error: string | null;
}

export interface BacktestWatchOptions {
  /** Aborting stops listening (detach); it never cancels the job. */
  readonly signal: AbortSignal;
  readonly onUpdate?: ((job: BacktestJobSnapshot) => void) | undefined;
  /** New log lines, in order, as soon as the server publishes them. */
  readonly onLogs?: ((lines: readonly string[]) => void) | undefined;
}

/** Lab service operations used to run and follow a backtest. */
export interface BacktestService {
  submit(request: BacktestRunRequest): Promise<BacktestJobSnapshot>;
  /** Resolves with the terminal snapshot (completed, failed or cancelled). */
  watch(
    backtestId: string,
    options: BacktestWatchOptions
  ): Promise<BacktestJobSnapshot>;
  cancel(backtestId: string): Promise<void>;
  fetchResult(backtestId: string): Promise<BacktestResult>;
}

export function isTerminalStatus(status: BacktestJobStatus): boolean {
  return (
    status === 'completed' || status === 'failed' || status === 'cancelled'
  );
}
