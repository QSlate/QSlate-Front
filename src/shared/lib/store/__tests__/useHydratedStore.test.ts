// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { create } from 'zustand';

import { useHydratedStore } from '../useHydratedStore';

interface TestStore {
  count: number;
  increment: () => void;
}

const useTestStore = create<TestStore>((set) => ({
  count: 42,
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
});
