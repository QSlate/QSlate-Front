import type { BackoffOptions, WebSocketState } from '../types';

const VALID_TRANSITIONS: Readonly<
  Record<WebSocketState, ReadonlySet<WebSocketState>>
> = {
  DISCONNECTED: new Set<WebSocketState>(['CONNECTING']),
  CONNECTING: new Set<WebSocketState>(['CONNECTED', 'DISCONNECTED', 'ERROR']),
  CONNECTED: new Set<WebSocketState>(['CONNECTING', 'DISCONNECTED', 'ERROR']),
  ERROR: new Set<WebSocketState>(['CONNECTING', 'DISCONNECTED']),
};

export function calculateBackoffDelay(
  attempt: number,
  options: BackoffOptions,
  random: () => number = Math.random
): number {
  const { initialDelayMs, maxDelayMs, multiplier, jitterFactor } = options;
  const safeAttempt = Math.max(0, attempt);
  const baseDelay = Math.min(
    initialDelayMs * Math.pow(multiplier, safeAttempt),
    maxDelayMs
  );

  // Bounded full jitter distributes reconnection spikes within [1 - factor, 1 + factor] of exponential delay
  const jitterRange = (random() * 2 - 1) * jitterFactor;
  const randomizedDelay = Math.round(baseDelay * (1 + jitterRange));

  return Math.max(0, Math.min(randomizedDelay, maxDelayMs));
}

export function isValidStateTransition(
  from: WebSocketState,
  to: WebSocketState
): boolean {
  if (from === to) {
    return false;
  }
  return VALID_TRANSITIONS[from].has(to);
}
