'use client';

import { create } from 'zustand';

export interface ToastNotice {
  readonly id: string;
  readonly message: string;
  readonly type: 'success' | 'info' | 'warning' | 'error';
}

const TOAST_DURATION_MS = 3_500;

/** Lab-wide UI state shared by pages: toast and logs console. */
export interface LabState {
  toast: ToastNotice | null;
  isExecutionLogsOpen: boolean;
  showToast: (message: string, type?: ToastNotice['type']) => void;
  clearToast: () => void;
  setExecutionLogsOpen: (open: boolean) => void;
  toggleExecutionLogs: () => void;
}

let toastCounter = 0;

export const useLabStore = create<LabState>()((set, get) => ({
  toast: null,
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
  setExecutionLogsOpen: (open) => set({ isExecutionLogsOpen: open }),
  toggleExecutionLogs: () =>
    set((state) => ({ isExecutionLogsOpen: !state.isExecutionLogsOpen })),
}));
