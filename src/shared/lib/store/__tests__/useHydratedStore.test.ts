// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { createStore } from 'zustand/vanilla';

import { useHydratedStore } from '../useHydratedStore';

interface TestStore {
  count: number;
  increment: () => void;
}

const useTestStore = create<TestStore>((set) => ({
  count: 42,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

const vanillaStore = createStore<TestStore>((set) => ({
  count: 7,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

describe('useHydratedStore', () => {
  it('returns selected state value on hydrated client mount', () => {
    const { result } = renderHook(() =>
      useHydratedStore(useTestStore, (state) => state.count)
    );

    expect(result.current).toBe(42);
  });

  it('supports fallback value parameter signature', () => {
    const { result } = renderHook(() =>
      useHydratedStore(useTestStore, (state) => state.count, 0)
    );

    expect(result.current).toBe(42);
  });

  it('supports vanilla Zustand stores with inferred state types', () => {
    const { result } = renderHook(() =>
      useHydratedStore(vanillaStore, (state) => state.count)
    );

    expect(result.current).toBe(7);
  });

  it('uses the fallback during server rendering', () => {
    function ServerProbe() {
      const count = useHydratedStore(useTestStore, (state) => state.count, 0);

      return createElement('span', null, count);
    }

    expect(renderToString(createElement(ServerProbe))).toBe('<span>0</span>');
  });
});
