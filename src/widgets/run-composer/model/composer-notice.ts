'use client';

import { create } from 'zustand';

const NOTICE_DURATION_MS = 4_000;

interface ComposerNoticeState {
  /** Short live message, e.g. why Cmd/Ctrl+Enter did nothing. */
  readonly notice: string | null;
  announce: (message: string) => void;
  clear: () => void;
}

let clearTimer: ReturnType<typeof setTimeout> | null = null;

/** Transient (not persisted) feedback shared by the composer and its hint. */
export const useComposerNotice = create<ComposerNoticeState>()((set) => ({
  notice: null,
  announce: (message) => {
    if (clearTimer !== null) clearTimeout(clearTimer);
    set({ notice: message });
    clearTimer = setTimeout(() => {
      clearTimer = null;
      set({ notice: null });
    }, NOTICE_DURATION_MS);
  },
  clear: () => {
    if (clearTimer !== null) clearTimeout(clearTimer);
    clearTimer = null;
    set({ notice: null });
  },
}));
