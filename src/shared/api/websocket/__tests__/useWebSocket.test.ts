// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useWebSocket } from '../useWebSocket';
import {
  calculateBackoffDelay,
  isValidStateTransition,
} from '../utils/backoff';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  url: string;
  protocols?: string | string[] | undefined;
  readyState: number = MockWebSocket.CONNECTING;

  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  send = vi.fn();
  close = vi.fn((code: number = 1000, reason?: string) => {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(
        new CloseEvent('close', {
          code,
          reason: reason ?? '',
          wasClean: code === 1000,
        })
      );
    }
  });

  constructor(url: string, protocols?: string | string[] | undefined) {
    this.url = url;
    this.protocols = protocols;
    MockWebSocket.instances.push(this);
  }

  triggerOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  triggerMessage(data: unknown): void {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    this.onmessage?.(new MessageEvent('message', { data: serialized }));
  }

  triggerError(): void {
    this.onerror?.(new Event('error'));
  }

  triggerClose(code: number = 1006, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(
      new CloseEvent('close', {
        code,
        reason: reason ?? '',
        wasClean: code === 1000,
      })
    );
  }
}

describe('WebSocket Service Utilities', () => {
  describe('calculateBackoffDelay', () => {
    const baseOptions = {
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      multiplier: 2,
      jitterFactor: 0.2,
    };

    it('calculates deterministic delay with zero jitter factor', () => {
      const options = { ...baseOptions, jitterFactor: 0 };
      expect(calculateBackoffDelay(0, options)).toBe(1000);
      expect(calculateBackoffDelay(1, options)).toBe(2000);
      expect(calculateBackoffDelay(2, options)).toBe(4000);
      expect(calculateBackoffDelay(3, options)).toBe(8000);
    });

    it('caps exponential progression at maxDelayMs', () => {
      const options = { ...baseOptions, jitterFactor: 0 };
      expect(calculateBackoffDelay(5, options)).toBe(10000);
    });

    it('applies bounded jitter limits correctly', () => {
      const minJitterRandom = () => 0;
      const maxJitterRandom = () => 1;
      const midJitterRandom = () => 0.5;

      expect(calculateBackoffDelay(0, baseOptions, minJitterRandom)).toBe(800);
      expect(calculateBackoffDelay(0, baseOptions, maxJitterRandom)).toBe(1200);
      expect(calculateBackoffDelay(0, baseOptions, midJitterRandom)).toBe(1000);
    });
  });

  describe('isValidStateTransition', () => {
    it('validates allowed transitions', () => {
      expect(isValidStateTransition('DISCONNECTED', 'CONNECTING')).toBe(true);
      expect(isValidStateTransition('CONNECTING', 'CONNECTED')).toBe(true);
      expect(isValidStateTransition('CONNECTING', 'DISCONNECTED')).toBe(true);
      expect(isValidStateTransition('CONNECTING', 'ERROR')).toBe(true);
      expect(isValidStateTransition('CONNECTED', 'DISCONNECTED')).toBe(true);
      expect(isValidStateTransition('CONNECTED', 'CONNECTING')).toBe(true);
      expect(isValidStateTransition('CONNECTED', 'ERROR')).toBe(true);
      expect(isValidStateTransition('ERROR', 'CONNECTING')).toBe(true);
      expect(isValidStateTransition('ERROR', 'DISCONNECTED')).toBe(true);
    });

    it('rejects disallowed transitions and idempotent states', () => {
      expect(isValidStateTransition('DISCONNECTED', 'CONNECTED')).toBe(false);
      expect(isValidStateTransition('DISCONNECTED', 'ERROR')).toBe(false);
      expect(isValidStateTransition('ERROR', 'CONNECTED')).toBe(false);
      expect(isValidStateTransition('CONNECTED', 'CONNECTED')).toBe(false);
      expect(isValidStateTransition('DISCONNECTED', 'DISCONNECTED')).toBe(
        false
      );
    });
  });
});

describe('useWebSocket Hook', () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.WebSocket = originalWebSocket;
  });

  it('manages connection lifecycle: CONNECTING -> CONNECTED -> DISCONNECTED', () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'wss://stream.qslate.internal/v1/ticks',
        onOpen,
        onClose,
      })
    );

    expect(result.current.state).toBe('CONNECTING');
    expect(MockWebSocket.instances).toHaveLength(1);

    const socketInstance = MockWebSocket.instances[0]!;
    act(() => {
      socketInstance.triggerOpen();
    });

    expect(result.current.state).toBe('CONNECTED');
    expect(onOpen).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.state).toBe('DISCONNECTED');
    expect(socketInstance.close).toHaveBeenCalledWith(
      1000,
      'Programmatic disconnect'
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('honors autoConnect: false until connect is invoked', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'wss://stream.qslate.internal/v1/ticks',
        autoConnect: false,
      })
    );

    expect(result.current.state).toBe('DISCONNECTED');
    expect(MockWebSocket.instances).toHaveLength(0);

    act(() => {
      result.current.connect();
    });

    expect(result.current.state).toBe('CONNECTING');
    expect(MockWebSocket.instances).toHaveLength(1);

    act(() => {
      MockWebSocket.instances[0]!.triggerOpen();
    });

    expect(result.current.state).toBe('CONNECTED');
  });

  it('handles JSON message deserialization and typed dispatching', () => {
    interface TickMessage {
      symbol: string;
      price: number;
    }

    const onMessage = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket<TickMessage>({
        url: 'wss://stream.qslate.internal/v1/ticks',
        onMessage,
      })
    );

    const socket = MockWebSocket.instances[0]!;
    act(() => {
      socket.triggerOpen();
    });

    const mockPayload: TickMessage = { symbol: 'BTC-USDT', price: 92450.5 };
    act(() => {
      socket.triggerMessage(mockPayload);
    });

    expect(result.current.lastMessage).toEqual(mockPayload);
    expect(onMessage).toHaveBeenCalledWith(mockPayload);

    act(() => {
      const didSend = result.current.sendMessage({
        action: 'SUBSCRIBE',
        channel: 'ETH-USDT',
      });
      expect(didSend).toBe(true);
    });

    expect(socket.send).toHaveBeenCalledWith(
      JSON.stringify({ action: 'SUBSCRIBE', channel: 'ETH-USDT' })
    );
  });

  it('returns false on sendMessage when connection is not open', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'wss://stream.qslate.internal/v1/ticks',
        autoConnect: false,
      })
    );

    let sent = false;
    act(() => {
      sent = result.current.sendMessage({ action: 'PING' });
    });

    expect(sent).toBe(false);
  });

  it('progresses exponential backoff across consecutive unexpected drops', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'wss://stream.qslate.internal/v1/ticks',
        reconnect: true,
        maxReconnectAttempts: 3,
        initialReconnectDelayMs: 1000,
        backoffMultiplier: 2,
        jitterFactor: 0,
      })
    );

    expect(result.current.state).toBe('CONNECTING');
    const firstSocket = MockWebSocket.instances[0]!;

    act(() => {
      firstSocket.triggerOpen();
    });
    expect(result.current.state).toBe('CONNECTED');

    // First unexpected disconnect
    act(() => {
      firstSocket.triggerClose(1006, 'Abnormal Closure');
    });

    expect(result.current.state).toBe('CONNECTING');
    expect(result.current.reconnectAttempt).toBe(1);
    expect(MockWebSocket.instances).toHaveLength(1);

    // Fast-forward delay (1000ms for attempt 0)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(MockWebSocket.instances).toHaveLength(2);
    const secondSocket = MockWebSocket.instances[1]!;

    // Second unexpected disconnect without open
    act(() => {
      secondSocket.triggerClose(1006, 'Abnormal Closure');
    });

    expect(result.current.state).toBe('CONNECTING');
    expect(result.current.reconnectAttempt).toBe(2);

    // Fast-forward delay (2000ms for attempt 1)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(MockWebSocket.instances).toHaveLength(3);
  });

  it('transitions to ERROR when maxReconnectAttempts is exhausted', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'wss://stream.qslate.internal/v1/ticks',
        reconnect: true,
        maxReconnectAttempts: 2,
        initialReconnectDelayMs: 500,
        backoffMultiplier: 1.5,
        jitterFactor: 0,
      })
    );

    const firstSocket = MockWebSocket.instances[0]!;
    act(() => {
      firstSocket.triggerClose(1006);
    });

    expect(result.current.reconnectAttempt).toBe(1);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const secondSocket = MockWebSocket.instances[1]!;
    act(() => {
      secondSocket.triggerClose(1006);
    });

    expect(result.current.reconnectAttempt).toBe(2);

    act(() => {
      vi.advanceTimersByTime(750);
    });

    const thirdSocket = MockWebSocket.instances[2]!;
    act(() => {
      thirdSocket.triggerClose(1006);
    });

    expect(result.current.state).toBe('ERROR');
    expect(result.current.reconnectAttempt).toBe(2);

    // Verify manual reconnection restores state
    act(() => {
      result.current.connect();
    });

    expect(result.current.state).toBe('CONNECTING');
    expect(result.current.reconnectAttempt).toBe(0);
  });

  it('ensures clean teardown on unmount without lingering timers or socket leaks', () => {
    const { result, unmount } = renderHook(() =>
      useWebSocket({
        url: 'wss://stream.qslate.internal/v1/ticks',
        initialReconnectDelayMs: 1000,
      })
    );

    const socket = MockWebSocket.instances[0]!;
    act(() => {
      socket.triggerOpen();
    });

    expect(result.current.state).toBe('CONNECTED');

    unmount();

    expect(socket.close).toHaveBeenCalledWith(1000, 'Component unmounted');

    // Ensure timer advance does not trigger reconnect after unmount
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(MockWebSocket.instances).toHaveLength(1);
  });
});
