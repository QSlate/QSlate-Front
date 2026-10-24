'use client';

import type { Layout, LayoutItem } from 'react-grid-layout';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

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
      (set) => ({
        layout: cloneLayout(DEFAULT_LAYOUT),
        activePreset: DEFAULT_LAYOUT_PRESET,

        addWidget: (widgetId: string) =>
          set(
            (state) => {
              const definition = KNOWN_WIDGET_LAYOUTS.find(
                (item) => item.i === widgetId
              );
              if (
                !definition ||
                state.layout.some((item) => item.i === widgetId)
              )
                return state;
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

        resetLayout: (presetName: string = DEFAULT_LAYOUT_PRESET) =>
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
          ),

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
