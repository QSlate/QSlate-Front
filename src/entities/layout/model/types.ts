import type { Layout, LayoutItem } from 'react-grid-layout';

export interface WidgetLayout extends LayoutItem {
  isPinned?: boolean | undefined;
  isMinimized?: boolean | undefined;
  isLocked?: boolean | undefined;
}

export type WidgetLayoutUpdate = Partial<Omit<WidgetLayout, 'i'>>;

export interface LayoutState {
  layout: readonly WidgetLayout[];
  activePreset: string;
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

export const DEFAULT_LAYOUT: readonly WidgetLayout[] = [
  {
    i: 'mini-ide',
    x: 0,
    y: 0,
    w: 8,
    h: 6,
    minW: 4,
    minH: 3,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
  {
    i: 'equity-curve',
    x: 8,
    y: 0,
    w: 4,
    h: 3,
    minW: 3,
    minH: 2,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
  {
    i: 'drawdown',
    x: 8,
    y: 3,
    w: 4,
    h: 3,
    minW: 3,
    minH: 2,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
];

export const LAYOUT_PRESETS: Readonly<Record<string, readonly WidgetLayout[]>> =
  {
    default: DEFAULT_LAYOUT,
  };
