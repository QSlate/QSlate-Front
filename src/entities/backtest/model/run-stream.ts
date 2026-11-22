import type { LabStreamEvent } from '@/shared/api/websocket';

import type { BacktestJobSnapshot, BacktestJobStatus } from './types';

/** Upper bound of log lines kept in memory for one run. */
export const MAX_RUN_LOG_LINES = 5_000;

/** What the stream has told us so far about one backtest. */
export interface RunStreamState {
  readonly backtestId: string;
  readonly status: BacktestJobStatus | null;
  /** Completion percentage 0–100 (the lab service sends integers). */
  readonly progress: number | null;
  /** Last applied event id, used to resume and to drop replays. */
  readonly lastEventId: number | null;
  readonly logs: readonly string[];
}

export function initialRunStreamState(backtestId: string): RunStreamState {
  return {
    backtestId,
    status: null,
    progress: null,
    lastEventId: null,
    logs: [],
  };
}

const STATUSES: readonly BacktestJobStatus[] = [
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
];

function toStatus(value: unknown): BacktestJobStatus | null {
  return STATUSES.find((status) => status === value) ?? null;
}

function toProgress(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : null;
}

/** Splits the engine's buffered log text into non-empty lines. */
export function splitLogLines(text: unknown): string[] {
  if (typeof text !== 'string') return [];
  return text.split(/\r?\n/).filter((line) => line.trim() !== '');
}

/**
 * Applies one lab stream event. Events at or before `lastEventId` (replayed
 * after a resume) are ignored; telemetry only advances the cursor.
 */
export function reduceRunStreamEvent(
  state: RunStreamState,
  event: LabStreamEvent
): RunStreamState {
  if (state.lastEventId !== null && event.eventId <= state.lastEventId) {
    return state;
  }
  const next = { ...state, lastEventId: event.eventId };
  switch (event.type) {
    case 'status': {
      const status = toStatus(event.data.status);
      const progress = toProgress(event.data.progress);
      return {
        ...next,
        status: status ?? state.status,
        progress: progress ?? (status === 'completed' ? 100 : state.progress),
      };
    }
    case 'progress':
      return {
        ...next,
        progress: toProgress(event.data.progress) ?? state.progress,
      };
    case 'logs': {
      const lines = splitLogLines(event.data.logs);
      return lines.length === 0
        ? next
        : {
            ...next,
            logs: [...state.logs, ...lines].slice(-MAX_RUN_LOG_LINES),
          };
    }
    case 'telemetry':
      return next;
  }
}

export function streamSnapshot(state: RunStreamState): BacktestJobSnapshot {
  return {
    backtestId: state.backtestId,
    status: state.status ?? 'queued',
    progress: state.progress,
    error: null,
  };
}
