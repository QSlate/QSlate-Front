'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  UseWebSocketOptions,
  UseWebSocketReturn,
  WebSocketState,
} from './types';
import { calculateBackoffDelay, isValidStateTransition } from './utils/backoff';

export function useWebSocket<TData = unknown>(
  options: UseWebSocketOptions<TData>
): UseWebSocketReturn<TData> {
  const {
    url,
    protocols,
    autoConnect = true,
    reconnect = true,
    maxReconnectAttempts = 5,
    initialReconnectDelayMs = 1000,
    maxReconnectDelayMs = 30000,
    backoffMultiplier = 1.5,
    jitterFactor = 0.2,
  } = options;

  const [state, setState] = useState<WebSocketState>(() =>
    autoConnect ? 'CONNECTING' : 'DISCONNECTED'
  );
  const [lastMessage, setLastMessage] = useState<TData | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef<number>(0);
  const isExplicitDisconnectRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  });

  const updateState = useCallback((nextState: WebSocketState) => {
    setState((currentState) => {
      if (isValidStateTransition(currentState, nextState)) {
        return nextState;
      }
      return currentState;
    });
  }, []);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const createSocketRef = useRef<() => void>(() => {});
  const resolvedUrl = typeof url === 'function' ? url() : url;

  const createSocket = useCallback(() => {
    if (typeof WebSocket === 'undefined') {
      return;
    }

    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.CONNECTING ||
        wsRef.current.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    let socket: WebSocket;
    try {
      socket =
        protocols !== undefined
          ? new WebSocket(resolvedUrl, protocols)
          : new WebSocket(resolvedUrl);
    } catch {
      queueMicrotask(() => {
        if (isMountedRef.current) {
          updateState('ERROR');
          optionsRef.current.onError?.(new Event('error'));
        }
      });
      return;
    }

    wsRef.current = socket;

    socket.onopen = (event: Event) => {
      // Ignore callbacks from stale socket instances replaced during reconnect races
      if (!isMountedRef.current || wsRef.current !== socket) {
        return;
      }
      reconnectAttemptRef.current = 0;
      setReconnectAttempt(0);
      updateState('CONNECTED');
      optionsRef.current.onOpen?.(event);
    };

    socket.onmessage = (event: MessageEvent) => {
      if (!isMountedRef.current || wsRef.current !== socket) {
        return;
      }
      let payload: TData;
      if (typeof event.data === 'string') {
        try {
          payload = JSON.parse(event.data) as TData;
        } catch {
          payload = event.data as unknown as TData;
        }
      } else {
        payload = event.data as TData;
      }
      setLastMessage(payload);
      optionsRef.current.onMessage?.(payload);
    };

    socket.onerror = (event: Event) => {
      if (
        !isMountedRef.current ||
        (wsRef.current !== null && wsRef.current !== socket)
      ) {
        return;
      }
      optionsRef.current.onError?.(event);
    };

    socket.onclose = (event: CloseEvent) => {
      if (
        !isMountedRef.current ||
        (wsRef.current !== null && wsRef.current !== socket)
      ) {
        return;
      }
      wsRef.current = null;
      optionsRef.current.onClose?.(event);

      if (isExplicitDisconnectRef.current) {
        updateState('DISCONNECTED');
        return;
      }

      if (reconnect && reconnectAttemptRef.current < maxReconnectAttempts) {
        const attempt = reconnectAttemptRef.current;
        const nextAttempt = attempt + 1;
        reconnectAttemptRef.current = nextAttempt;
        setReconnectAttempt(nextAttempt);
        updateState('CONNECTING');

        const delay = calculateBackoffDelay(attempt, {
          initialDelayMs: initialReconnectDelayMs,
          maxDelayMs: maxReconnectDelayMs,
          multiplier: backoffMultiplier,
          jitterFactor,
        });

        clearReconnectTimer();
        reconnectTimerRef.current = setTimeout(() => {
          if (isMountedRef.current && !isExplicitDisconnectRef.current) {
            createSocketRef.current();
          }
        }, delay);
      } else {
        if (reconnect && reconnectAttemptRef.current >= maxReconnectAttempts) {
          updateState('ERROR');
        } else {
          updateState('DISCONNECTED');
        }
      }
    };
  }, [
    backoffMultiplier,
    clearReconnectTimer,
    initialReconnectDelayMs,
    jitterFactor,
    maxReconnectAttempts,
    maxReconnectDelayMs,
    protocols,
    reconnect,
    resolvedUrl,
    updateState,
  ]);

  const connect = useCallback(() => {
    isExplicitDisconnectRef.current = false;
    clearReconnectTimer();
    reconnectAttemptRef.current = 0;
    setReconnectAttempt(0);
    updateState('CONNECTING');
    createSocketRef.current();
  }, [clearReconnectTimer, updateState]);

  const disconnect = useCallback(() => {
    isExplicitDisconnectRef.current = true;
    clearReconnectTimer();
    reconnectAttemptRef.current = 0;
    setReconnectAttempt(0);

    if (wsRef.current) {
      const socket = wsRef.current;
      wsRef.current = null;
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close(1000, 'Programmatic disconnect');
      }
    }
    updateState('DISCONNECTED');
  }, [clearReconnectTimer, updateState]);

  const sendMessage = useCallback((message: unknown): boolean => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      const payload =
        typeof message === 'string'
          ? message
          : typeof ArrayBuffer !== 'undefined' && message instanceof ArrayBuffer
            ? message
            : typeof Blob !== 'undefined' && message instanceof Blob
              ? message
              : JSON.stringify(message);
      wsRef.current.send(payload);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    createSocketRef.current = createSocket;
    isMountedRef.current = true;
    isExplicitDisconnectRef.current = false;

    if (autoConnect) {
      createSocket();
    }

    return () => {
      isMountedRef.current = false;
      clearReconnectTimer();
      if (wsRef.current) {
        const socket = wsRef.current;
        wsRef.current = null;
        socket.close(1000, 'Component unmounted');
      }
    };
  }, [autoConnect, clearReconnectTimer, createSocket]);

  return {
    state,
    lastMessage,
    reconnectAttempt,
    sendMessage,
    connect,
    disconnect,
  };
}
