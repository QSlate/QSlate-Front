import type { ComponentType } from 'react';

import type { WidgetLayout } from '@/entities/layout/model';

export const GRID_BREAKPOINTS = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
} as const;

export const GRID_COLS = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
} as const;

export type GridBreakpoint = keyof typeof GRID_BREAKPOINTS;

export const GRID_ROW_HEIGHT = 40;
export const GRID_MARGIN: [number, number] = [12, 12];
export const GRID_CONTAINER_PADDING: [number, number] = [16, 16];

export interface WidgetComponentProps {
  id: string;
}

export interface WidgetDefinition {
  id: string;
  title: string;
  component: ComponentType<WidgetComponentProps>;
  defaultLayout?: Partial<WidgetLayout> | undefined;
  isLocked?: boolean | undefined;
}

export type { WidgetContainerProps } from '@/entities/layout';

export interface DynamicGridProps {
  widgets?: Record<string, WidgetDefinition> | undefined;
  className?: string | undefined;
  isEditable?: boolean | undefined;
  onLayoutCommit?: ((layouts: WidgetLayout[]) => void) | undefined;
}
