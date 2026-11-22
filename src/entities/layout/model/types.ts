import type { Layout, LayoutItem } from 'react-grid-layout';

import type { Dashboard, DashboardSummary } from '@/shared/api';

export interface WidgetLayout extends LayoutItem {
  isPinned?: boolean | undefined;
  isMinimized?: boolean | undefined;
  isLocked?: boolean | undefined;
}

export type WidgetLayoutUpdate = Partial<Omit<WidgetLayout, 'i'>>;

export interface LayoutState {
  layout: readonly WidgetLayout[];
  activePreset: LayoutPresetName;
  dashboards: DashboardSummary[];
  activeDashboardId: string | null;
  activeDashboardTitle: string;
  dashboardRevision: number;
  isSyncing: boolean;
}

export interface LayoutActions {
  setLayout: (layout: Layout) => void;
  addWidget: (
    widgetId: string,
    customDimensions?: {
      w?: number;
      h?: number;
      minW?: number;
      minH?: number;
    }
  ) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (
    widgetId: LayoutItem['i'],
    updates: WidgetLayoutUpdate
  ) => void;
  resetLayout: (presetName?: string) => void;
  toggleWidgetPin: (widgetId: LayoutItem['i']) => void;
  toggleWidgetMinimize: (widgetId: LayoutItem['i']) => void;
  loadDashboards: (token?: string | null) => Promise<void>;
  selectDashboard: (
    dashboardId: string,
    token?: string | null
  ) => Promise<void>;
  createDashboard: (title: string, token?: string | null) => Promise<Dashboard>;
  duplicateActiveDashboard: (token?: string | null) => Promise<Dashboard>;
  deleteActiveDashboard: (token?: string | null) => Promise<void>;
  saveServerLayout: (token?: string | null) => Promise<void>;
}

export type LayoutStore = LayoutState & LayoutActions;

export const DEFAULT_LAYOUT = [
  {
    i: 'capital-chart',
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
    i: 'drawdowns',
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
    i: 'monthly-returns',
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
    i: 'trades',
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
    i: 'net-return',
    x: 0,
    y: 14,
    w: 3,
    h: 3,
    minW: 2,
    minH: 3,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
  {
    i: 'max-drawdown',
    x: 3,
    y: 14,
    w: 3,
    h: 3,
    minW: 2,
    minH: 3,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
  {
    i: 'sharpe',
    x: 6,
    y: 14,
    w: 3,
    h: 3,
    minW: 2,
    minH: 3,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
  {
    i: 'win-rate',
    x: 9,
    y: 14,
    w: 3,
    h: 3,
    minW: 2,
    minH: 3,
    isPinned: false,
    isMinimized: false,
    isLocked: false,
  },
  {
    i: 'trade-distribution',
    x: 0,
    y: 17,
    w: 6,
    h: 5,
    minW: 3,
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
