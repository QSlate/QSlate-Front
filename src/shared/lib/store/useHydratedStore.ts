'use client';

import { useSyncExternalStore } from 'react';
import type { ExtractState, StoreApi } from 'zustand';
import { useStore } from 'zustand';

const emptySubscribe = () => () => {};

type ReadonlyStoreApi<T> = Pick<
  StoreApi<T>,
  'getInitialState' | 'getState' | 'subscribe'
>;

export function useHydratedStore<
  TStore extends ReadonlyStoreApi<unknown>,
  TSelected,
>(
  store: TStore,
  selector: (state: ExtractState<TStore>) => TSelected
): TSelected | undefined;
export function useHydratedStore<
  TStore extends ReadonlyStoreApi<unknown>,
  TSelected,
>(
  store: TStore,
  selector: (state: ExtractState<TStore>) => TSelected,
  fallback: TSelected
): TSelected;
export function useHydratedStore<
  TStore extends ReadonlyStoreApi<unknown>,
  TSelected,
>(
  store: TStore,
  selector: (state: ExtractState<TStore>) => TSelected,
  fallback?: TSelected
): TSelected | undefined {
  const storeValue = useStore(store, selector);
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return isHydrated ? storeValue : fallback;
}
