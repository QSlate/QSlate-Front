import type { ComponentType, ReactNode } from 'react';

import type { WidgetLayout } from '@/entities/layout/model';

export const GRID_BREAKPOINTS = { lg: 900, md: 768, sm: 480, xs: 0 } as const;
export const GRID_COLS = { lg: 12, md: 12, sm: 1, xs: 1 } as const;
export type GridBreakpoint = keyof typeof GRID_BREAKPOINTS;
export const GRID_ROW_HEIGHT = 32;
export const GRID_MARGIN: [number, number] = [10, 10];
export const GRID_CONTAINER_PADDING: [number, number] = [0, 0];

export interface WidgetComponentProps {
  id: string;
}

export interface WidgetDefinition {
  id: string;
  title: string;
  component: ComponentType<WidgetComponentProps>;
  icon?: ReactNode;
  toolbar?: ComponentType;
  defaultLayout?: Partial<WidgetLayout> | undefined;
  isLocked?: boolean | undefined;
}

export type { WidgetContainerProps } from '@/entities/layout';

export interface DynamicGridProps {
  widgets?: Record<string, WidgetDefinition> | undefined;
  className?: string | undefined;
  isEditable?: boolean | undefined;
  onRemove?: ((id: string) => void) | undefined;
  onExpand?: ((id: string) => void) | undefined;
  rowHeight?: number | undefined;
  onLayoutCommit?: ((layouts: WidgetLayout[]) => void) | undefined;
}
