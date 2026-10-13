import type { Layout, LayoutItem } from 'react-grid-layout';

export interface WidgetLayout extends LayoutItem {
  isPinned?: boolean | undefined;
  isMinimized?: boolean | undefined;
  isLocked?: boolean | undefined;
}

export type WidgetLayoutUpdate = Partial<Omit<WidgetLayout, 'i'>>;

export interface LayoutState {
  layout: readonly WidgetLayout[];
  activePreset: LayoutPresetName;
}

export interface LayoutActions {
  setLayout: (layout: Layout) => void;
  updateWidget: (
    widgetId: LayoutItem['i'],
    updates: WidgetLayoutUpdate
  ) => void;
  resetLayout: (presetName?: string) => void;
  toggleWidgetPin: (widgetId: LayoutItem['i']) => void;
  toggleWidgetMinimize: (widgetId: LayoutItem['i']) => void;
}

export type LayoutStore = LayoutState & LayoutActions;

export const DEFAULT_LAYOUT = [
  {
    i: 'mini-ide',
    x: 0,
    y: 0,
    w: 7,
    h: 8,
    minW: 4,
    minH: 3,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
  {
    i: 'equity-curve',
    x: 7,
    y: 0,
    w: 5,
    h: 5,
    minW: 3,
    minH: 3,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
  {
    i: 'drawdown',
    x: 7,
    y: 5,
    w: 5,
    h: 3,
    minW: 3,
    minH: 2,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
] satisfies readonly WidgetLayout[];

export const LAYOUT_PRESETS = {
  default: DEFAULT_LAYOUT,
} as const satisfies Readonly<Record<string, readonly WidgetLayout[]>>;

export type LayoutPresetName = keyof typeof LAYOUT_PRESETS;

export const DEFAULT_LAYOUT_PRESET: LayoutPresetName = 'default';
