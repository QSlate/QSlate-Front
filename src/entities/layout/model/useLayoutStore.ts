'use client';

import type { Layout, LayoutItem } from 'react-grid-layout';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

import { apiClient } from '@/shared/api';

import type {
  LayoutPresetName,
  LayoutStore,
  WidgetLayout,
  WidgetLayoutUpdate,
} from './types';
import {
  DEFAULT_LAYOUT,
  DEFAULT_LAYOUT_PRESET,
  KNOWN_WIDGET_LAYOUTS,
  LAYOUT_PRESETS,
} from './types';

type WidgetBooleanFlag = 'isMinimized' | 'isPinned';

function cloneLayout(layout: readonly WidgetLayout[]): WidgetLayout[] {
  return layout.map((item) => ({ ...item }));
}

function updateLayoutItem(
  layout: readonly WidgetLayout[],
  widgetId: LayoutItem['i'],
  update: (item: WidgetLayout) => WidgetLayout
): readonly WidgetLayout[] {
  const itemIndex = layout.findIndex((item) => item.i === widgetId);

  if (itemIndex === -1) {
    return layout;
  }

  const nextLayout = [...layout];
  nextLayout[itemIndex] = update(layout[itemIndex]);

  return nextLayout;
}

function toggleWidgetFlag(
  layout: readonly WidgetLayout[],
  widgetId: LayoutItem['i'],
  flag: WidgetBooleanFlag
): readonly WidgetLayout[] {
  return updateLayoutItem(layout, widgetId, (item) => ({
    ...item,
    [flag]: !item[flag],
  }));
}

function isLayoutPresetName(name: string): name is LayoutPresetName {
  return Object.hasOwn(LAYOUT_PRESETS, name);
}

function resolveLayoutPreset(name: string): {
  name: LayoutPresetName;
  layout: readonly WidgetLayout[];
} {
  const resolvedName = isLayoutPresetName(name) ? name : DEFAULT_LAYOUT_PRESET;

  return {
    name: resolvedName,
    layout: LAYOUT_PRESETS[resolvedName],
  };
}

function findWidget(
  layout: readonly WidgetLayout[],
  widgetId: LayoutItem['i']
): WidgetLayout | undefined {
  return layout.find((item) => item.i === widgetId);
}

export const LAYOUT_STORAGE_KEY = 'qslate_lab_layout';

// Layout editing remains available when browser storage is disabled or full.
const layoutStorage = createJSONStorage<{ layout: readonly WidgetLayout[] }>(
  () => ({
    getItem: (name) => {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        localStorage.setItem(name, value);
      } catch {
        // The in-memory layout still works for the current session.
      }
    },
    removeItem: (name) => {
      try {
        localStorage.removeItem(name);
      } catch {
        // Storage can be unavailable in private or restricted contexts.
      }
    },
  })
);

export function sanitizeLayout(value: unknown): WidgetLayout[] {
  if (!Array.isArray(value)) return cloneLayout(DEFAULT_LAYOUT);
  const seen = new Set<string>();
  const restored = value.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Record<string, unknown>;
    const definition = KNOWN_WIDGET_LAYOUTS.find(
      (entry) => entry.i === candidate.i
    );
    if (!definition || seen.has(definition.i)) return [];
    const valid = ['x', 'y', 'w', 'h'].every(
      (key) =>
        typeof candidate[key] === 'number' && Number.isFinite(candidate[key])
    );
    if (!valid) return [];
    seen.add(definition.i);
    const width = Math.min(
      12,
      Math.max(definition.minW ?? 1, Math.round(candidate.w as number))
    );
    return [
      {
        ...definition,
        x: Math.min(12 - width, Math.max(0, Math.round(candidate.x as number))),
        y: Math.min(1000, Math.max(0, Math.round(candidate.y as number))),
        w: width,
        h: Math.min(
          30,
          Math.max(definition.minH ?? 1, Math.round(candidate.h as number))
        ),
        isPinned: candidate.isPinned === true,
        isMinimized: candidate.isMinimized === true,
      },
    ];
  });
  return value.length && !restored.length
    ? cloneLayout(DEFAULT_LAYOUT)
    : restored;
}

export const useLayoutStore = create<LayoutStore>()(
  devtools(
    persist(
      (set, get) => ({
        layout: cloneLayout(DEFAULT_LAYOUT),
        activePreset: DEFAULT_LAYOUT_PRESET,
        dashboards: [],
        activeDashboardId: null,
        activeDashboardTitle: 'Default Workspace',
        dashboardRevision: 1,
        isSyncing: false,

        addWidget: (
          widgetId: string,
          customDimensions?: {
            w?: number;
            h?: number;
            minW?: number;
            minH?: number;
          }
        ) =>
          set(
            (state) => {
              if (state.layout.some((item) => item.i === widgetId)) {
                return state;
              }
              const known = KNOWN_WIDGET_LAYOUTS.find(
                (item) => item.i === widgetId
              );
              if (!known && !customDimensions) {
                return state;
              }
              const definition = known ?? {
                i: widgetId,
                x: 0,
                y: 0,
                w: customDimensions?.w ?? 6,
                h: customDimensions?.h ?? 4,
                minW: customDimensions?.minW ?? 3,
                minH: customDimensions?.minH ?? 2,
              };
              const bottom = state.layout.reduce(
                (max, item) => Math.max(max, item.y + item.h),
                0
              );
              return {
                layout: [...state.layout, { ...definition, y: bottom }],
              };
            },
            false,
            'layout/addWidget'
          ),

        removeWidget: (widgetId: string) =>
          set(
            (state) => ({
              layout: state.layout.filter((item) => item.i !== widgetId),
            }),
            false,
            'layout/removeWidget'
          ),

        setLayout: (layout: Layout) =>
          set(
            (state) => {
              const currentById = new Map(
                state.layout.map((item) => [item.i, item])
              );

              return {
                layout: layout.map((item) => ({
                  ...currentById.get(item.i),
                  ...item,
                  i: item.i,
                })),
              };
            },
            false,
            'layout/setLayout'
          ),

        updateWidget: (
          widgetId: LayoutItem['i'],
          updates: WidgetLayoutUpdate
        ) =>
          set(
            (state) => {
              const layout = updateLayoutItem(
                state.layout,
                widgetId,
                (current) => ({
                  ...current,
                  ...updates,
                  i: current.i,
                })
              );

              return layout === state.layout ? state : { layout };
            },
            false,
            'layout/updateWidget'
          ),

        resetLayout: (presetName: string = DEFAULT_LAYOUT_PRESET) => {
          const activeId = get().activeDashboardId;
          if (activeId) {
            void apiClient.resetDashboardLayout(activeId).catch(() => {});
          }
          set(
            () => {
              const preset = resolveLayoutPreset(presetName);

              return {
                layout: cloneLayout(preset.layout),
                activePreset: preset.name,
              };
            },
            false,
            'layout/resetLayout'
          );
        },

        toggleWidgetPin: (widgetId: LayoutItem['i']) =>
          set(
            (state) => {
              const layout = toggleWidgetFlag(
                state.layout,
                widgetId,
                'isPinned'
              );

              return layout === state.layout ? state : { layout };
            },
            false,
            'layout/toggleWidgetPin'
          ),

        toggleWidgetMinimize: (widgetId: LayoutItem['i']) =>
          set(
            (state) => {
              const layout = toggleWidgetFlag(
                state.layout,
                widgetId,
                'isMinimized'
              );

              return layout === state.layout ? state : { layout };
            },
            false,
            'layout/toggleWidgetMinimize'
          ),

        loadDashboards: async (token?: string | null) => {
          try {
            set({ isSyncing: true }, false, 'layout/loadDashboards/start');
            const page = await apiClient.getDashboards(token);
            set(
              {
                dashboards: page.items,
                isSyncing: false,
              },
              false,
              'layout/loadDashboards/success'
            );
            if (!get().activeDashboardId && page.items.length > 0) {
              await get().selectDashboard(page.items[0].id, token);
            }
          } catch (err) {
            set({ isSyncing: false }, false, 'layout/loadDashboards/error');
            console.error('Failed to load dashboards', err);
          }
        },

        selectDashboard: async (dashboardId: string, token?: string | null) => {
          try {
            set({ isSyncing: true }, false, 'layout/selectDashboard/start');
            const d = await apiClient.getDashboard(dashboardId, token);
            let mappedLayout: WidgetLayout[] = [];
            if (d.layout && d.layout.length > 0) {
              mappedLayout = d.layout.map((item) => {
                const known = KNOWN_WIDGET_LAYOUTS.find(
                  (k) => k.i === item.instance_id
                );
                return {
                  i: item.instance_id,
                  x: item.x,
                  y: item.y,
                  w: item.width,
                  h: item.height,
                  minW: known?.minW ?? 3,
                  minH: known?.minH ?? 2,
                  isPinned: false,
                  isMinimized: false,
                };
              });
            } else {
              mappedLayout = cloneLayout(DEFAULT_LAYOUT);
            }
            set(
              {
                activeDashboardId: d.id,
                activeDashboardTitle: d.title,
                dashboardRevision: d.revision,
                layout: mappedLayout,
                isSyncing: false,
              },
              false,
              'layout/selectDashboard/success'
            );
          } catch (err) {
            set({ isSyncing: false }, false, 'layout/selectDashboard/error');
            console.error('Failed to select dashboard', err);
          }
        },

        createDashboard: async (title: string, token?: string | null) => {
          set({ isSyncing: true }, false, 'layout/createDashboard/start');
          try {
            const created = await apiClient.createDashboard({ title }, token);
            set(
              (state) => ({
                dashboards: [
                  ...state.dashboards,
                  {
                    id: created.id,
                    title: created.title,
                    description: created.description,
                    tags: created.tags,
                    revision: created.revision,
                    created_at: created.created_at,
                    updated_at: created.updated_at,
                  },
                ],
                activeDashboardId: created.id,
                activeDashboardTitle: created.title,
                dashboardRevision: created.revision,
                layout: cloneLayout(DEFAULT_LAYOUT),
                isSyncing: false,
              }),
              false,
              'layout/createDashboard/success'
            );
            return created;
          } catch (err) {
            set({ isSyncing: false }, false, 'layout/createDashboard/error');
            throw err;
          }
        },

        duplicateActiveDashboard: async (token?: string | null) => {
          const currentId = get().activeDashboardId;
          if (!currentId) {
            throw new Error('No active dashboard to duplicate');
          }
          set({ isSyncing: true }, false, 'layout/duplicateDashboard/start');
          try {
            const duplicated = await apiClient.duplicateDashboard(
              currentId,
              token
            );
            set(
              (state) => ({
                dashboards: [
                  ...state.dashboards,
                  {
                    id: duplicated.id,
                    title: duplicated.title,
                    description: duplicated.description,
                    tags: duplicated.tags,
                    revision: duplicated.revision,
                    created_at: duplicated.created_at,
                    updated_at: duplicated.updated_at,
                  },
                ],
                activeDashboardId: duplicated.id,
                activeDashboardTitle: duplicated.title,
                dashboardRevision: duplicated.revision,
                isSyncing: false,
              }),
              false,
              'layout/duplicateDashboard/success'
            );
            return duplicated;
          } catch (err) {
            set({ isSyncing: false }, false, 'layout/duplicateDashboard/error');
            throw err;
          }
        },

        deleteActiveDashboard: async (token?: string | null) => {
          const currentId = get().activeDashboardId;
          if (!currentId) return;
          set({ isSyncing: true }, false, 'layout/deleteDashboard/start');
          try {
            await apiClient.deleteDashboard(currentId, token);
            const remaining = get().dashboards.filter(
              (d) => d.id !== currentId
            );
            if (remaining.length > 0) {
              set(
                { dashboards: remaining, isSyncing: false },
                false,
                'layout/deleteDashboard/success'
              );
              await get().selectDashboard(remaining[0].id, token);
            } else {
              set(
                {
                  dashboards: [],
                  activeDashboardId: null,
                  activeDashboardTitle: 'Default Workspace',
                  dashboardRevision: 1,
                  layout: cloneLayout(DEFAULT_LAYOUT),
                  isSyncing: false,
                },
                false,
                'layout/deleteDashboard/reset'
              );
            }
          } catch (err) {
            set({ isSyncing: false }, false, 'layout/deleteDashboard/error');
            throw err;
          }
        },

        saveServerLayout: async (token?: string | null) => {
          const currentId = get().activeDashboardId;
          if (!currentId) return;
          set({ isSyncing: true }, false, 'layout/saveServerLayout/start');
          try {
            const currentLayout = get().layout;
            const items = currentLayout.map((l) => ({
              instance_id: l.i,
              x: l.x,
              y: l.y,
              width: l.w,
              height: l.h,
            }));
            const updated = await apiClient.updateDashboardLayout(
              currentId,
              {
                revision: get().dashboardRevision,
                items,
              },
              token
            );
            set(
              {
                dashboardRevision: updated.revision,
                isSyncing: false,
              },
              false,
              'layout/saveServerLayout/success'
            );
          } catch (err) {
            set({ isSyncing: false }, false, 'layout/saveServerLayout/error');
            console.error('Failed to save layout to server', err);
          }
        },
      }),
      {
        name: LAYOUT_STORAGE_KEY,
        storage: layoutStorage,
        version: 1,
        partialize: (state) => ({ layout: state.layout }),
        merge: (persisted, current) => ({
          ...current,
          layout:
            persisted && typeof persisted === 'object' && 'layout' in persisted
              ? sanitizeLayout(persisted.layout)
              : current.layout,
        }),
      }
    ),
    { name: 'QSlateLayoutStore' }
  )
);

export const selectLayout = (state: LayoutStore): readonly WidgetLayout[] =>
  state.layout;

export const selectWidgetLayout =
  (widgetId: LayoutItem['i']) =>
  (state: LayoutStore): WidgetLayout | undefined =>
    findWidget(state.layout, widgetId);

function createWidgetFlagSelector(flag: WidgetBooleanFlag) {
  return (widgetId: LayoutItem['i']): ((state: LayoutStore) => boolean) => {
    return (state) => Boolean(findWidget(state.layout, widgetId)?.[flag]);
  };
}

export const selectIsWidgetPinned = createWidgetFlagSelector('isPinned');

export const selectIsWidgetMinimized = createWidgetFlagSelector('isMinimized');

export const selectActivePreset = (state: LayoutStore): LayoutPresetName =>
  state.activePreset;
