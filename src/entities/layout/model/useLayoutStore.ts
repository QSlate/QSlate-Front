import type { Layout, LayoutItem } from 'react-grid-layout';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { LayoutStore, WidgetLayout, WidgetLayoutUpdate } from './types';
import { DEFAULT_LAYOUT, LAYOUT_PRESETS } from './types';

function cloneLayout(layout: readonly WidgetLayout[]): WidgetLayout[] {
  return layout.map((item) => ({ ...item }));
}

function updateLayoutItem(
  layout: readonly WidgetLayout[],
  widgetId: LayoutItem['i'],
  update: (item: WidgetLayout) => WidgetLayout
): readonly WidgetLayout[] {
  if (!layout.some((item) => item.i === widgetId)) {
    return layout;
  }

  return layout.map((item) => (item.i === widgetId ? update(item) : item));
}

export const useLayoutStore = create<LayoutStore>()(
  devtools(
    (set) => ({
      layout: cloneLayout(DEFAULT_LAYOUT),
      activePreset: 'default',

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

      resetLayout: (presetName: string = 'default') =>
        set(
          () => {
            const targetPreset = LAYOUT_PRESETS[presetName] ?? DEFAULT_LAYOUT;
            return {
              layout: cloneLayout(targetPreset),
              activePreset:
                presetName in LAYOUT_PRESETS ? presetName : 'default',
            };
          },
          false,
          'layout/resetLayout'
        ),

      toggleWidgetPin: (widgetId: LayoutItem['i']) =>
        set(
          (state) => {
            const layout = updateLayoutItem(
              state.layout,
              widgetId,
              (current) => ({
                ...current,
                isPinned: !current.isPinned,
              })
            );

            return layout === state.layout ? state : { layout };
          },
          false,
          'layout/toggleWidgetPin'
        ),

      toggleWidgetMinimize: (widgetId: LayoutItem['i']) =>
        set(
          (state) => {
            const layout = updateLayoutItem(
              state.layout,
              widgetId,
              (current) => ({
                ...current,
                isMinimized: !current.isMinimized,
              })
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
    state.layout.find((item) => item.i === widgetId);

export const selectIsWidgetPinned =
  (widgetId: LayoutItem['i']) =>
  (state: LayoutStore): boolean =>
    Boolean(state.layout.find((item) => item.i === widgetId)?.isPinned);

export const selectIsWidgetMinimized =
  (widgetId: LayoutItem['i']) =>
  (state: LayoutStore): boolean =>
    Boolean(state.layout.find((item) => item.i === widgetId)?.isMinimized);

export const selectActivePreset = (state: LayoutStore): string =>
  state.activePreset;
