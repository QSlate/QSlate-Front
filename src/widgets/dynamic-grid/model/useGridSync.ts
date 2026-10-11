'use client';

import { useCallback, useMemo, useState } from 'react';
import type {
  EventCallback,
  Layout,
  LayoutItem,
  ResponsiveLayouts,
} from 'react-grid-layout';
import { useShallow } from 'zustand/react/shallow';

import {
  type LayoutDictionary,
  useLayoutStore,
  type WidgetLayout,
} from '@/entities/layout/model';

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
  layouts: LayoutDictionary;
  rglLayout: Layout;
  rglLayouts: ResponsiveLayouts;
  handleBreakpointChange: (newBreakpoint: string, newCols: number) => void;
  handleDragStop: EventCallback;
  handleResizeStop: EventCallback;
}

export function useGridSync(
  options: UseGridSyncOptions = {}
): UseGridSyncReturn {
  const { widgets, isEditable = true, onLayoutCommit } = options;

  const [currentBreakpoint, setCurrentBreakpoint] =
    useState<GridBreakpoint>('lg');

  const { layouts: storeLayouts, batchUpdateLayouts } = useLayoutStore(
    useShallow((state) => ({
      layouts: state.layouts,
      batchUpdateLayouts: state.batchUpdateLayouts,
    }))
  );

  const rglLayout: Layout = useMemo(() => {
    const widgetIds = new Set<string>([
      ...Object.keys(storeLayouts),
      ...(widgets ? Object.keys(widgets) : []),
    ]);

    return Array.from(widgetIds).map((id): LayoutItem => {
      const layout = storeLayouts[id];
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
  }, [storeLayouts, widgets, isEditable]);

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
      const currentStoreLayouts = useLayoutStore.getState().layouts;
      const updatedList: WidgetLayout[] = updatedLayout.map(
        (item: LayoutItem) => {
          const existing = currentStoreLayouts[item.i];
          const widgetDef = widgets?.[item.i];
          const defaultLayout = widgetDef?.defaultLayout;

          const isMinimized =
            existing?.isMinimized ?? defaultLayout?.isMinimized ?? false;

          const widgetLayout: WidgetLayout = {
            id: item.i,
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

      batchUpdateLayouts(updatedList);
      onLayoutCommit?.(updatedList);
    },
    [batchUpdateLayouts, onLayoutCommit, widgets]
  );

  const handleDragStop: EventCallback = useCallback(
    (layout) => {
      commitLayoutChanges(layout);
    },
    [commitLayoutChanges]
  );

  const handleResizeStop: EventCallback = useCallback(
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
    layouts: storeLayouts,
    rglLayout,
    rglLayouts,
    handleBreakpointChange,
    handleDragStop,
    handleResizeStop,
  };
}
