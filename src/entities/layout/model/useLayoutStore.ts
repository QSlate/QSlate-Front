'use client';

import type { Layout, LayoutItem } from 'react-grid-layout';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type {
  LayoutPresetName,
  LayoutStore,
  WidgetLayout,
  WidgetLayoutUpdate,
} from './types';
import { DEFAULT_LAYOUT, DEFAULT_LAYOUT_PRESET, LAYOUT_PRESETS } from './types';

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

export const useLayoutStore = create<LayoutStore>()(
  devtools(
    (set) => ({
      layout: cloneLayout(DEFAULT_LAYOUT),
      activePreset: DEFAULT_LAYOUT_PRESET,

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

      updateWidget: (widgetId: LayoutItem['i'], updates: WidgetLayoutUpdate) =>
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
            const layout = toggleWidgetFlag(state.layout, widgetId, 'isPinned');

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
