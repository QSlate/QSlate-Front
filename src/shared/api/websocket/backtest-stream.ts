/**
 * Client for GET /qslate/v1/ws/backtests/{backtestId}/stream (see
 * QSlate-Back docs/streams.asyncapi.json and services/lab stream handler):
 * - the first and only client frame is `authenticate` (within 5 s), with an
 *   optional integer `after_event_id` to resume after the last event seen;
 * - the server then sends durable events `{ event_id, type, data,
 *   created_at }` with type status | progress | logs | telemetry;
 * - any other client frame is closed with 1008; keep-alive uses protocol
 *   ping/pong, answered by the browser itself;
 * - 1000 closes after the terminal backlog, 1008 rejects the session or
 *   backtest, 1013 means the backtest is temporarily unavailable.
 */

export type LabStreamEventType = 'status' | 'progress' | 'logs' | 'telemetry';

export interface LabStreamEvent {
  readonly eventId: number;
  readonly type: LabStreamEventType;
  readonly data: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
}

export interface LabStreamClose {
  readonly code: number;
  readonly reason: string;
}

/** The subset of the WebSocket API used by the stream (eases testing). */
export interface StreamSocket {
  readonly readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  send: (data: string) => void;
  close: (code?: number, reason?: string) => void;
}

const SOCKET_CONNECTING = 0;
const SOCKET_OPEN = 1;

export interface BacktestStreamOptions {
  readonly url: string;
  readonly accessToken: string;
  /** Resume after this event id (exclusive). */
  readonly afterEventId?: number | null | undefined;
  readonly onEvent: (event: LabStreamEvent) => void;
  /** Called once when the socket closes (not after `detach`). */
  readonly onClose: (close: LabStreamClose) => void;
  /** Injectable for tests. */
  readonly createSocket?: ((url: string) => StreamSocket) | undefined;
}

export interface BacktestStreamConnection {
  /** Stops listening and closes the socket; no callback fires afterwards. */
  detach: () => void;
}

const EVENT_TYPES: readonly LabStreamEventType[] = [
  'status',
  'progress',
  'logs',
  'telemetry',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEventType(value: unknown): value is LabStreamEventType {
  return EVENT_TYPES.some((type) => type === value);
}

/** Validates one server frame; returns null for anything unexpected. */
export function parseLabStreamEvent(raw: unknown): LabStreamEvent | null {
  if (typeof raw !== 'string') return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    !isRecord(parsed) ||
    typeof parsed.event_id !== 'number' ||
    !Number.isInteger(parsed.event_id) ||
    !isEventType(parsed.type) ||
    !isRecord(parsed.data)
  ) {
    return null;
  }
  return {
    eventId: parsed.event_id,
    type: parsed.type,
    data: parsed.data,
    createdAt: typeof parsed.created_at === 'string' ? parsed.created_at : '',
  };
}

/** Opens one authenticated stream session (no reconnection here). */
export function connectBacktestStream({
  url,
  accessToken,
  afterEventId,
  onEvent,
  onClose,
  createSocket = (target) => new WebSocket(target),
}: BacktestStreamOptions): BacktestStreamConnection {
  let detached = false;
  const socket = createSocket(url);

  socket.onopen = () => {
    if (detached) return;
    socket.send(
      JSON.stringify({
        type: 'authenticate',
        access_token: accessToken,
        ...(afterEventId !== null && afterEventId !== undefined
          ? { after_event_id: afterEventId }
          : {}),
      })
    );
  };
  socket.onmessage = (message: MessageEvent) => {
    if (detached) return;
    const event = parseLabStreamEvent(message.data);
    if (event) onEvent(event);
  };
  socket.onclose = (event: CloseEvent) => {
    if (detached) return;
    detached = true;
    onClose({ code: event.code, reason: event.reason });
  };

  return {
    detach: () => {
      if (detached) return;
      detached = true;
      if (
        socket.readyState === SOCKET_CONNECTING ||
        socket.readyState === SOCKET_OPEN
      ) {
        socket.close(1000, 'client detached');
      }
    },
  };
}
