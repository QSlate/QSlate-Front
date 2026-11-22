// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFakeSocket, FakeWebSocket } from '@/shared/lib/test';

import { connectBacktestStream, parseLabStreamEvent } from '../backtest-stream';

afterEach(() => {
  FakeWebSocket.reset();
  vi.clearAllMocks();
});

function connect(afterEventId: number | null = null) {
  const onEvent = vi.fn();
  const onClose = vi.fn();
  const connection = connectBacktestStream({
    url: 'ws://localhost:8080/qslate/v1/ws/backtests/bt-1/stream',
    accessToken: 'token-123',
    afterEventId,
    onEvent,
    onClose,
    createSocket: createFakeSocket,
  });
  return { connection, onEvent, onClose, socket: FakeWebSocket.latest() };
}

describe('connectBacktestStream', () => {
  it('sends authenticate as the first and only frame, without the token in the URL', () => {
    const { socket } = connect();
    expect(socket.url).not.toContain('token');

    socket.serverOpen();

    expect(socket.sent).toEqual([
      JSON.stringify({ type: 'authenticate', access_token: 'token-123' }),
    ]);
  });

  it('resumes after the last event id', () => {
    const { socket } = connect(41);
    socket.serverOpen();
    expect(JSON.parse(socket.sent[0] ?? '{}')).toEqual({
      type: 'authenticate',
      access_token: 'token-123',
      after_event_id: 41,
    });
  });

  it('forwards valid events and ignores malformed frames', () => {
    const { socket, onEvent } = connect();
    socket.serverOpen();

    socket.serverSend({
      event_id: 7,
      type: 'progress',
      data: { progress: 62 },
      created_at: '2026-11-22T10:00:00Z',
    });
    socket.serverSend({ type: 'stream.error.v1', code: 'x', message: 'y' });

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({
      eventId: 7,
      type: 'progress',
      data: { progress: 62 },
      createdAt: '2026-11-22T10:00:00Z',
    });
  });

  it('reports the close code once', () => {
    const { socket, onClose } = connect();
    socket.serverClose(1008, 'invalid access token');
    socket.serverClose(1000);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith({
      code: 1008,
      reason: 'invalid access token',
    });
  });

  it('detaches silently: closes the socket and drops later frames', () => {
    const { socket, connection, onEvent, onClose } = connect();
    socket.serverOpen();

    connection.detach();
    socket.serverSend({
      event_id: 1,
      type: 'status',
      data: {},
      created_at: '',
    });
    socket.serverClose(1000);

    expect(socket.closedWith?.code).toBe(1000);
    expect(onEvent).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('parseLabStreamEvent', () => {
  it('rejects non JSON, unknown types and non integer ids', () => {
    expect(parseLabStreamEvent('nope')).toBeNull();
    expect(
      parseLabStreamEvent(
        JSON.stringify({ event_id: 1.5, type: 'status', data: {} })
      )
    ).toBeNull();
    expect(
      parseLabStreamEvent(
        JSON.stringify({ event_id: 1, type: 'tick', data: {} })
      )
    ).toBeNull();
  });
});
