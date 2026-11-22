import { apiClient } from '@/shared/api';
import {
  type BacktestStreamConnection,
  type BacktestStreamOptions,
} from '@/shared/api/websocket';

import {
  initialRunStreamState,
  reduceRunStreamEvent,
  type RunStreamState,
  splitLogLines,
  streamSnapshot,
} from '../model/run-stream';
import {
  type BacktestJobSnapshot,
  type BacktestWatchOptions,
  isTerminalStatus,
} from '../model/types';

/** Reconnection attempts before falling back to REST polling. */
const MAX_STREAM_RECONNECTS = 4;
const RECONNECT_BASE_DELAY_MS = 500;
/** Close codes after which the socket is not retried (rejected session/run). */
const NON_RETRYABLE_CLOSE_CODES = new Set([1008]);

export interface StreamWatchDeps {
  readonly connect: (
    options: BacktestStreamOptions
  ) => BacktestStreamConnection;
  readonly getToken: () => string | null;
  readonly getUrl: (backtestId: string) => string;
  /** Resolves the terminal job with its server error (REST). */
  readonly confirm: (
    backtestId: string,
    options: BacktestWatchOptions
  ) => Promise<BacktestJobSnapshot>;
  readonly delay: (ms: number, signal: AbortSignal) => Promise<void>;
}

type SessionOutcome =
  | { readonly kind: 'terminal' }
  | { readonly kind: 'closed'; readonly retryable: boolean };

function abortError(): DOMException {
  return new DOMException('Stopped listening to the backtest', 'AbortError');
}

/**
 * Follows a backtest over the authenticated WebSocket stream: resumes with
 * `after_event_id` after each drop, retries with backoff, then falls back to
 * REST polling (`deps.confirm`) when the socket is unavailable or rejected.
 * Once the stream reports a terminal status, the job is confirmed over REST
 * so failed runs carry their server error.
 */
export async function watchBacktestStream(
  backtestId: string,
  options: BacktestWatchOptions,
  deps: StreamWatchDeps
): Promise<BacktestJobSnapshot> {
  const { signal, onUpdate, onLogs } = options;
  let state: RunStreamState = initialRunStreamState(backtestId);
  let reconnects = 0;

  const openSession = (token: string) =>
    new Promise<SessionOutcome>((resolve, reject) => {
      let connection: BacktestStreamConnection | null = null;
      const onAbort = () => {
        connection?.detach();
        reject(abortError());
      };
      connection = deps.connect({
        url: deps.getUrl(backtestId),
        accessToken: token,
        afterEventId: state.lastEventId,
        onEvent: (event) => {
          const previous = state;
          state = reduceRunStreamEvent(state, event);
          if (state === previous) return;
          reconnects = 0;
          if (event.type === 'logs') {
            const added = splitLogLines(event.data.logs);
            if (added.length > 0) onLogs?.(added);
          }
          if (
            state.status !== previous.status ||
            state.progress !== previous.progress
          ) {
            onUpdate?.(streamSnapshot(state));
          }
          if (state.status !== null && isTerminalStatus(state.status)) {
            signal.removeEventListener('abort', onAbort);
            connection?.detach();
            resolve({ kind: 'terminal' });
          }
        },
        onClose: ({ code }) => {
          signal.removeEventListener('abort', onAbort);
          resolve({
            kind: 'closed',
            retryable: !NON_RETRYABLE_CLOSE_CODES.has(code),
          });
        },
      });
      signal.addEventListener('abort', onAbort, { once: true });
    });

  for (;;) {
    if (signal.aborted) throw abortError();
    const token = deps.getToken();
    if (!token) break;
    let outcome: SessionOutcome;
    try {
      outcome = await openSession(token);
    } catch (error) {
      if (signal.aborted) throw abortError();
      throw error;
    }
    if (outcome.kind === 'terminal') break;
    if (!outcome.retryable || reconnects >= MAX_STREAM_RECONNECTS) break;
    reconnects += 1;
    await deps.delay(RECONNECT_BASE_DELAY_MS * 2 ** (reconnects - 1), signal);
  }
  return deps.confirm(backtestId, options);
}

export function backtestStreamUrl(backtestId: string): string {
  return apiClient.getWebSocketUrl(
    `/qslate/v1/ws/backtests/${encodeURIComponent(backtestId)}/stream`
  );
}

export function canOpenWebSocket(): boolean {
  return typeof WebSocket !== 'undefined';
}
