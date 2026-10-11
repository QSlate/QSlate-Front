import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { LayoutDictionary, LayoutStore, WidgetLayout } from './types';
import { DEFAULT_LAYOUTS, LAYOUT_PRESETS } from './types';

export const useLayoutStore = create<LayoutStore>()(
  devtools(
    (set) => ({
      layouts: { ...DEFAULT_LAYOUTS },
      activePreset: 'default',

      updateWidgetLayout: (id: string, partial: Partial<WidgetLayout>) =>
        set(
          (state) => {
            const current = state.layouts[id];
            if (!current) {
              return state;
            }
            return {
              layouts: {
                ...state.layouts,
                [id]: {
                  ...current,
                  ...partial,
                  id,
                },
              },
            };
          },
          false,
          'layout/updateWidgetLayout'
        ),

      batchUpdateLayouts: (incomingLayouts: WidgetLayout[]) =>
        set(
          (state) => {
            const nextLayouts: LayoutDictionary = { ...state.layouts };
            for (const item of incomingLayouts) {
              const current = nextLayouts[item.id];
              if (current) {
                nextLayouts[item.id] = {
                  ...current,
                  ...item,
                  id: item.id,
                };
              } else {
                nextLayouts[item.id] = { ...item };
              }
            }
            return { layouts: nextLayouts };
          },
          false,
          'layout/batchUpdateLayouts'
        ),

      resetLayout: (presetName: string = 'default') =>
        set(
          () => {
            const targetPreset = LAYOUT_PRESETS[presetName] ?? DEFAULT_LAYOUTS;
            return {
              layouts: { ...targetPreset },
              activePreset:
                presetName in LAYOUT_PRESETS ? presetName : 'default',
            };
          },
          false,
          'layout/resetLayout'
        ),

      toggleWidgetPin: (id: string) =>
        set(
          (state) => {
            const current = state.layouts[id];
            if (!current) {
              return state;
            }
            return {
              layouts: {
                ...state.layouts,
                [id]: {
                  ...current,
                  isPinned: !current.isPinned,
                },
              },
            };
          },
          false,
          'layout/toggleWidgetPin'
        ),

      toggleWidgetMinimize: (id: string) =>
        set(
          (state) => {
            const current = state.layouts[id];
            if (!current) {
              return state;
            }
            return {
              layouts: {
                ...state.layouts,
                [id]: {
                  ...current,
                  isMinimized: !current.isMinimized,
                },
              },
            };
          },
          false,
          'layout/toggleWidgetMinimize'
        ),
    }),
    { name: 'QSlateLayoutStore' }
  )
);

export const selectLayouts = (state: LayoutStore): LayoutDictionary =>
  state.layouts;

export const selectWidgetLayout =
  (id: string) =>
  (state: LayoutStore): WidgetLayout | undefined =>
    state.layouts[id];

export const selectIsWidgetPinned =
  (id: string) =>
  (state: LayoutStore): boolean =>
    Boolean(state.layouts[id]?.isPinned);

export const selectIsWidgetMinimized =
  (id: string) =>
  (state: LayoutStore): boolean =>
    Boolean(state.layouts[id]?.isMinimized);

export const selectActivePreset = (state: LayoutStore): string =>
  state.activePreset;
