'use client';

import { useCallback, useMemo, useState } from 'react';
import type {
  Layout,
  LayoutItem,
  ResponsiveGridLayoutProps,
  ResponsiveLayouts,
} from 'react-grid-layout';
import { useShallow } from 'zustand/react/shallow';

import { useLayoutStore, type WidgetLayout } from '@/entities/layout/model';

import {
  GRID_BREAKPOINTS,
  type GridBreakpoint,
  type WidgetDefinition,
} from '../types';

export interface UseGridSyncOptions {
  widgets?: Record<string, WidgetDefinition> | undefined;
  isEditable?: boolean | undefined;
  onLayoutCommit?: ((layouts: WidgetLayout[]) => void) | undefined;
}

export interface UseGridSyncReturn {
  currentBreakpoint: GridBreakpoint;
  widgetLayouts: Readonly<Record<string, WidgetLayout>>;
  rglLayout: Layout;
  rglLayouts: ResponsiveLayouts;
  handleBreakpointChange: (newBreakpoint: string, newCols: number) => void;
  handleDragStop: NonNullable<ResponsiveGridLayoutProps['onDragStop']>;
  handleResizeStop: NonNullable<ResponsiveGridLayoutProps['onResizeStop']>;
}

export function useGridSync(
  options: UseGridSyncOptions = {}
): UseGridSyncReturn {
  const { widgets, isEditable = true, onLayoutCommit } = options;

  const [currentBreakpoint, setCurrentBreakpoint] =
    useState<GridBreakpoint>('lg');

  const { layout: storeLayout, setLayout } = useLayoutStore(
    useShallow((state) => ({
      layout: state.layout,
      setLayout: state.setLayout,
    }))
  );

  const widgetLayouts = useMemo<Readonly<Record<string, WidgetLayout>>>(
    () =>
      Object.fromEntries(storeLayout.map((item) => [item.i, item] as const)),
    [storeLayout]
  );

  const rglLayout: Layout = useMemo(() => {
    const widgetIds = new Set<string>([
      ...Object.keys(widgetLayouts),
      ...(widgets ? Object.keys(widgets) : []),
    ]);

    return Array.from(widgetIds).map((id): LayoutItem => {
      const layout = widgetLayouts[id];
      const widgetDef = widgets?.[id];
      const defaultLayout = widgetDef?.defaultLayout;

      const x = layout?.x ?? defaultLayout?.x ?? 0;
      const y = layout?.y ?? defaultLayout?.y ?? 0;
      const w = layout?.w ?? defaultLayout?.w ?? 4;
      const rawH = layout?.h ?? defaultLayout?.h ?? 4;
      const isMinimized =
        layout?.isMinimized ?? defaultLayout?.isMinimized ?? false;
      const isPinned = layout?.isPinned ?? defaultLayout?.isPinned ?? false;
      const isLocked =
        layout?.isLocked ??
        defaultLayout?.isLocked ??
        widgetDef?.isLocked ??
        false;

      const isStatic = !isEditable || isPinned || isLocked;
      const isDraggable = isEditable && !isPinned && !isLocked;
      const isResizable = isEditable && !isPinned && !isLocked && !isMinimized;

      const item: LayoutItem = {
        i: id,
        x,
        y,
        w,
        h: isMinimized ? 1 : rawH,
        minW: layout?.minW ?? defaultLayout?.minW ?? 2,
        minH: isMinimized ? 1 : (layout?.minH ?? defaultLayout?.minH ?? 2),
        static: isStatic,
        isDraggable,
        isResizable,
      };

      const maxW = layout?.maxW ?? defaultLayout?.maxW;
      if (maxW !== undefined) {
        item.maxW = maxW;
      }

      const maxH = isMinimized ? 1 : (layout?.maxH ?? defaultLayout?.maxH);
      if (maxH !== undefined) {
        item.maxH = maxH;
      }

      return item;
    });
  }, [isEditable, widgetLayouts, widgets]);

  const rglLayouts: ResponsiveLayouts = useMemo(() => {
    return (Object.keys(GRID_BREAKPOINTS) as GridBreakpoint[]).reduce(
      (acc, bp) => {
        acc[bp] = rglLayout;
        return acc;
      },
      {} as ResponsiveLayouts
    );
  }, [rglLayout]);

  const commitLayoutChanges = useCallback(
    (updatedLayout: Layout) => {
      const currentById = new Map(
        useLayoutStore.getState().layout.map((item) => [item.i, item])
      );

      const updatedList: WidgetLayout[] = updatedLayout.map(
        (item: LayoutItem) => {
          const existing = currentById.get(item.i);
          const widgetDef = widgets?.[item.i];
          const defaultLayout = widgetDef?.defaultLayout;

          const isMinimized =
            existing?.isMinimized ?? defaultLayout?.isMinimized ?? false;

          const widgetLayout: WidgetLayout = {
            i: item.i,
            x: item.x,
            y: item.y,
            w: item.w,
            h: isMinimized
              ? (existing?.h ?? defaultLayout?.h ?? item.h)
              : item.h,
            isPinned: existing?.isPinned ?? defaultLayout?.isPinned ?? false,
            isMinimized,
            isLocked:
              existing?.isLocked ??
              defaultLayout?.isLocked ??
              widgetDef?.isLocked ??
              false,
          };

          const minW = existing?.minW ?? defaultLayout?.minW;
          if (minW !== undefined) {
            widgetLayout.minW = minW;
          }

          const minH = existing?.minH ?? defaultLayout?.minH;
          if (minH !== undefined) {
            widgetLayout.minH = minH;
          }

          const maxW = existing?.maxW ?? defaultLayout?.maxW;
          if (maxW !== undefined) {
            widgetLayout.maxW = maxW;
          }

          const maxH = existing?.maxH ?? defaultLayout?.maxH;
          if (maxH !== undefined) {
            widgetLayout.maxH = maxH;
          }

          return widgetLayout;
        }
      );

      setLayout(updatedList);
      onLayoutCommit?.(updatedList);
    },
    [onLayoutCommit, setLayout, widgets]
  );

  const handleDragStop: NonNullable<ResponsiveGridLayoutProps['onDragStop']> =
    useCallback(
      (layout) => {
        commitLayoutChanges(layout);
      },
      [commitLayoutChanges]
    );

  const handleResizeStop: NonNullable<
    ResponsiveGridLayoutProps['onResizeStop']
  > = useCallback(
    (layout) => {
      commitLayoutChanges(layout);
    },
    [commitLayoutChanges]
  );

  const handleBreakpointChange = useCallback((newBreakpoint: string) => {
    if (newBreakpoint in GRID_BREAKPOINTS) {
      setCurrentBreakpoint(newBreakpoint as GridBreakpoint);
    }
  }, []);

  return {
    currentBreakpoint,
    widgetLayouts,
    rglLayout,
    rglLayouts,
    handleBreakpointChange,
    handleDragStop,
    handleResizeStop,
  };
}
