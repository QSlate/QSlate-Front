'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

export function useHydratedStore<T, F>(
  store: (selector: (state: T) => F) => F,
  selector: (state: T) => F
): F | undefined;
export function useHydratedStore<T, F>(
  store: (selector: (state: T) => F) => F,
  selector: (state: T) => F,
  fallback: F
): F;
export function useHydratedStore<T, F>(
  store: (selector: (state: T) => F) => F,
  selector: (state: T) => F,
  fallback?: F
): F | undefined {
  const storeValue = store(selector);
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return isHydrated ? storeValue : fallback;
}
