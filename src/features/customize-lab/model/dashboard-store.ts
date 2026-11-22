'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useHydratedStore } from '@/shared/lib/store';

import {
  type DashboardLayout,
  DEFAULT_DASHBOARD_LAYOUT,
  sanitizeDashboardLayout,
} from './dashboard-layout';

export const DASHBOARD_STORAGE_KEY = 'qslate_lab_dashboards';
/** Key of the dashboard used before any server dashboard exists. */
export const LOCAL_DASHBOARD_KEY = 'local';

interface DashboardState {
  /** Saved layouts by dashboard id (or LOCAL_DASHBOARD_KEY). */
  readonly layouts: Readonly<Record<string, DashboardLayout>>;
  /** Dashboard shown in the Lab (server id or null for the local one). */
  readonly activeId: string | null;
  /** Edit session: the draft being arranged, null outside edit mode. */
  readonly draft: DashboardLayout | null;
  readonly catalogOpen: boolean;
  setActive: (id: string | null) => void;
  saveLayout: (key: string, layout: DashboardLayout) => void;
  forgetLayout: (key: string) => void;
  startEditing: (current: DashboardLayout) => void;
  updateDraft: (layout: DashboardLayout) => void;
  stopEditing: () => void;
  setCatalogOpen: (open: boolean) => void;
}

function sanitizeLayouts(value: unknown): Record<string, DashboardLayout> {
  if (typeof value !== 'object' || value === null) return {};
  const layouts: Record<string, DashboardLayout> = {};
  for (const [key, raw] of Object.entries(value)) {
    const layout = sanitizeDashboardLayout(raw);
    if (layout) layouts[key] = layout;
  }
  return layouts;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      layouts: {},
      activeId: null,
      draft: null,
      catalogOpen: false,
      setActive: (activeId) =>
        set({ activeId, draft: null, catalogOpen: false }),
      saveLayout: (key, layout) =>
        set((state) => ({ layouts: { ...state.layouts, [key]: layout } })),
      forgetLayout: (key) =>
        set((state) => {
          const layouts = { ...state.layouts };
          delete layouts[key];
          return { layouts };
        }),
      startEditing: (current) => set({ draft: current }),
      updateDraft: (layout) =>
        set((state) => (state.draft === null ? state : { draft: layout })),
      stopEditing: () => set({ draft: null, catalogOpen: false }),
      setCatalogOpen: (catalogOpen) => set({ catalogOpen }),
    }),
    {
      name: DASHBOARD_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        layouts: state.layouts,
        activeId: state.activeId,
      }),
      merge: (persisted, current) => {
        const record =
          typeof persisted === 'object' && persisted !== null ? persisted : {};
        const layouts = 'layouts' in record ? record.layouts : undefined;
        const activeId = 'activeId' in record ? record.activeId : undefined;
        return {
          ...current,
          layouts: sanitizeLayouts(layouts),
          activeId: typeof activeId === 'string' ? activeId : null,
        };
      },
    }
  )
);

/** Saved layout of a dashboard, or the default one. */
export function layoutFor(
  layouts: Readonly<Record<string, DashboardLayout>>,
  key: string
): DashboardLayout {
  return layouts[key] ?? DEFAULT_DASHBOARD_LAYOUT;
}

const NO_LAYOUTS: Readonly<Record<string, DashboardLayout>> = {};

/** Active dashboard id, null until the persisted store is hydrated. */
export function useActiveDashboardId(): string | null {
  return useHydratedStore(useDashboardStore, (state) => state.activeId, null);
}

/** Saved layouts, empty until the persisted store is hydrated. */
export function useSavedDashboardLayouts(): Readonly<
  Record<string, DashboardLayout>
> {
  return useHydratedStore(
    useDashboardStore,
    (state) => state.layouts,
    NO_LAYOUTS
  );
}
