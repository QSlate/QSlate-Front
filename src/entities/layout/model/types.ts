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
  addWidget: (widgetId: string) => void;
  removeWidget: (widgetId: string) => void;
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
    i: 'equity-curve',
    x: 0,
    y: 0,
    w: 8,
    h: 7,
    minW: 4,
    minH: 4,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
  {
    i: 'drawdown',
    x: 8,
    y: 0,
    w: 4,
    h: 7,
    minW: 3,
    minH: 4,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
  {
    i: 'execution-metrics',
    x: 0,
    y: 7,
    w: 4,
    h: 7,
    minW: 3,
    minH: 5,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
  {
    i: 'trade-log',
    x: 4,
    y: 7,
    w: 8,
    h: 7,
    minW: 4,
    minH: 4,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
] satisfies readonly WidgetLayout[];

export const KNOWN_WIDGET_LAYOUTS: readonly WidgetLayout[] = [
  ...DEFAULT_LAYOUT,
  {
    i: 'monte-carlo',
    x: 0,
    y: 14,
    w: 6,
    h: 7,
    minW: 4,
    minH: 4,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
  {
    i: 'order-book',
    x: 6,
    y: 14,
    w: 6,
    h: 7,
    minW: 4,
    minH: 4,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
  {
    i: 'volatility-filter',
    x: 0,
    y: 21,
    w: 12,
    h: 6,
    minW: 4,
    minH: 3,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
  {
    i: 'tradingview-candles',
    x: 0,
    y: 27,
    w: 12,
    h: 7,
    minW: 4,
    minH: 4,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
];

export const LAYOUT_PRESETS = {
  default: DEFAULT_LAYOUT,
} as const satisfies Readonly<Record<string, readonly WidgetLayout[]>>;

export type LayoutPresetName = keyof typeof LAYOUT_PRESETS;

export const DEFAULT_LAYOUT_PRESET: LayoutPresetName = 'default';
