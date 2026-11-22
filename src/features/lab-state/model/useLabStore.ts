'use client';

import { create } from 'zustand';

export interface ToastNotice {
  readonly id: string;
  readonly message: string;
  readonly type: 'success' | 'info' | 'warning' | 'error';
}

const TOAST_DURATION_MS = 3_500;

/** Lab-wide UI state shared by pages: toast, logs console, loaded backtest. */
export interface LabState {
  toast: ToastNotice | null;
  /** Backtest shown by the dashboard (set when a run completes or is opened). */
  loadedBacktestId: string | null;
  isExecutionLogsOpen: boolean;
  showToast: (message: string, type?: ToastNotice['type']) => void;
  clearToast: () => void;
  setLoadedBacktestId: (id: string | null) => void;
  setExecutionLogsOpen: (open: boolean) => void;
  toggleExecutionLogs: () => void;
}

let toastCounter = 0;

export const useLabStore = create<LabState>()((set, get) => ({
  toast: null,
  loadedBacktestId: null,
  isExecutionLogsOpen: false,
  showToast: (message, type = 'success') => {
    toastCounter += 1;
    const id = `toast-${toastCounter}`;
    set({ toast: { id, message, type } });
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, TOAST_DURATION_MS);
  },
  clearToast: () => set({ toast: null }),
  setLoadedBacktestId: (id) => set({ loadedBacktestId: id }),
  setExecutionLogsOpen: (open) => set({ isExecutionLogsOpen: open }),
  toggleExecutionLogs: () =>
    set((state) => ({ isExecutionLogsOpen: !state.isExecutionLogsOpen })),
}));
