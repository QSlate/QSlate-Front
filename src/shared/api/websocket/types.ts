export type WebSocketState =
  'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

export interface BackoffOptions {
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
  jitterFactor: number;
}

export interface UseWebSocketOptions<TData = unknown> {
  url: string | (() => string);
  protocols?: string | string[] | undefined;
  autoConnect?: boolean | undefined;
  reconnect?: boolean | undefined;
  maxReconnectAttempts?: number | undefined;
  initialReconnectDelayMs?: number | undefined;
  maxReconnectDelayMs?: number | undefined;
  backoffMultiplier?: number | undefined;
  jitterFactor?: number | undefined;
  onOpen?: ((event: Event) => void) | undefined;
  onClose?: ((event: CloseEvent) => void) | undefined;
  onError?: ((event: Event) => void) | undefined;
  onMessage?: ((data: TData) => void) | undefined;
}

export interface UseWebSocketReturn<TData = unknown> {
  state: WebSocketState;
  lastMessage: TData | null;
  reconnectAttempt: number;
  sendMessage: (message: unknown) => boolean;
  connect: () => void;
  disconnect: () => void;
}
