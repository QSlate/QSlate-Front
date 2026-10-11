export interface GridCoordinates {
  x: number;
  y: number;
}

export interface WidgetDimensions {
  w: number;
  h: number;
  minW?: number | undefined;
  minH?: number | undefined;
  maxW?: number | undefined;
  maxH?: number | undefined;
}

export interface WidgetLayout extends GridCoordinates, WidgetDimensions {
  id: string;
  isPinned?: boolean | undefined;
  isMinimized?: boolean | undefined;
  isLocked?: boolean | undefined;
}

export type LayoutDictionary = Record<string, WidgetLayout>;

export interface LayoutState {
  layouts: LayoutDictionary;
  activePreset: string;
}

export interface LayoutActions {
  updateWidgetLayout: (id: string, partial: Partial<WidgetLayout>) => void;
  batchUpdateLayouts: (layouts: WidgetLayout[]) => void;
  resetLayout: (presetName?: string) => void;
  toggleWidgetPin: (id: string) => void;
  toggleWidgetMinimize: (id: string) => void;
}

export type LayoutStore = LayoutState & LayoutActions;

export const DEFAULT_LAYOUTS: LayoutDictionary = {
  'mini-ide': {
    id: 'mini-ide',
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
  'equity-curve': {
    id: 'equity-curve',
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
  drawdown: {
    id: 'drawdown',
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
};

export const LAYOUT_PRESETS: Record<string, LayoutDictionary> = {
  default: DEFAULT_LAYOUTS,
};
