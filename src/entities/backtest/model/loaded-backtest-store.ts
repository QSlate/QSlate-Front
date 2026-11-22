'use client';

import { create } from 'zustand';

/** Backtest shown by the Lab (set when a run completes or is opened). */
export interface LoadedBacktestState {
  readonly loadedBacktestId: string | null;
  setLoadedBacktestId: (id: string | null) => void;
}

export const useLoadedBacktestStore = create<LoadedBacktestState>()((set) => ({
  loadedBacktestId: null,
  setLoadedBacktestId: (loadedBacktestId) => set({ loadedBacktestId }),
}));
