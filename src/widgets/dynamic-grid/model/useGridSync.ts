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
  GRID_MARGIN,
  GRID_ROW_HEIGHT,
  type GridBreakpoint,
  type WidgetDefinition,
} from '../types';

export interface UseGridSyncOptions {
  widgets?: Record<string, WidgetDefinition> | undefined;
  isEditable?: boolean | undefined;
  onLayoutCommit?: ((layouts: WidgetLayout[]) => void) | undefined;
  rowHeight?: number | undefined;
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
  const {
    widgets,
    isEditable = true,
    onLayoutCommit,
    rowHeight = GRID_ROW_HEIGHT,
  } = options;

  const [currentBreakpoint, setCurrentBreakpoint] =
    useState<GridBreakpoint>('lg');

  const { layout: storeLayout, setLayout } = useLayoutStore(
    useShallow((state) => ({
      layout: state.layout,
      setLayout: state.setLayout,
    }))
  );

  const widgetLayouts = useMemo<Readonly<Record<string, WidgetLayout>>>(() => {
    const layouts: Record<string, WidgetLayout> = Object.fromEntries(
      storeLayout.map((item) => [item.i, item] as const)
    );

    for (const [id, widget] of Object.entries(widgets ?? {})) {
      layouts[id] = {
        ...widget.defaultLayout,
        ...layouts[id],
        i: id,
        x: layouts[id]?.x ?? widget.defaultLayout?.x ?? 0,
        y: layouts[id]?.y ?? widget.defaultLayout?.y ?? 0,
        w: layouts[id]?.w ?? widget.defaultLayout?.w ?? 4,
        h: layouts[id]?.h ?? widget.defaultLayout?.h ?? 4,
        isLocked:
          layouts[id]?.isLocked ??
          widget.defaultLayout?.isLocked ??
          widget.isLocked ??
          false,
      };
    }

    return layouts;
  }, [storeLayout, widgets]);

  const rglLayout: Layout = useMemo(() => {
    const widgetIds = new Set(
      widgets ? Object.keys(widgets) : Object.keys(widgetLayouts)
    );

    return Array.from(widgetIds).map((id): LayoutItem => {
      const layout = widgetLayouts[id];
      const isMinimized = layout.isMinimized ?? false;
      const isPinned = layout.isPinned ?? false;
      const isLocked = layout.isLocked ?? false;

      const isStatic = !isEditable || isPinned || isLocked;
      const isDraggable = isEditable && !isPinned && !isLocked;
      const isResizable = isEditable && !isPinned && !isLocked && !isMinimized;

      const item: LayoutItem = {
        i: id,
        x: layout.x,
        y: layout.y,
        w: layout.w,
        h: isMinimized
          ? Math.ceil((36 + GRID_MARGIN[1]) / (rowHeight + GRID_MARGIN[1]))
          : layout.h,
        minW: layout.minW ?? 2,
        minH: isMinimized ? 1 : (layout.minH ?? 2),
        static: isStatic,
        isDraggable,
        isResizable,
      };

      const maxW = layout.maxW;
      if (maxW !== undefined) {
        item.maxW = maxW;
      }

      const maxH = isMinimized ? item.h : layout.maxH;
      if (maxH !== undefined) {
        item.maxH = maxH;
      }

      return item;
    });
  }, [isEditable, rowHeight, widgetLayouts, widgets]);

  const rglLayouts: ResponsiveLayouts = useMemo(() => {
    return (Object.keys(GRID_BREAKPOINTS) as GridBreakpoint[]).reduce(
      (acc, bp) => {
        if (bp === 'sm' || bp === 'xs') {
          let nextRow = 0;
          acc[bp] = [...rglLayout]
            .sort((a, b) => a.y - b.y || a.x - b.x)
            .map((item) => {
              const minimizedHeight = Math.ceil(
                (72 + GRID_MARGIN[1]) / (rowHeight + GRID_MARGIN[1])
              );
              const height = widgetLayouts[item.i].isMinimized
                ? minimizedHeight
                : item.h;
              const stacked = {
                ...item,
                x: 0,
                y: nextRow,
                w: 1,
                h: height,
                minW: 1,
                maxW: 1,
                ...(widgetLayouts[item.i].isMinimized ? { maxH: height } : {}),
                static: true,
                isDraggable: false,
                isResizable: false,
              };
              nextRow += height;
              return stacked;
            });
        } else {
          acc[bp] = rglLayout;
        }
        return acc;
      },
      {} as ResponsiveLayouts
    );
  }, [rglLayout, rowHeight, widgetLayouts]);

  const commitLayoutChanges = useCallback(
    (updatedLayout: Layout) => {
      if (
        !isEditable ||
        currentBreakpoint === 'sm' ||
        currentBreakpoint === 'xs'
      )
        return;
      const currentLayout = useLayoutStore.getState().layout;
      const currentById = new Map(currentLayout.map((item) => [item.i, item]));
      const updates = new Map<string, WidgetLayout>();

      for (const item of updatedLayout) {
        // Ignore stale callbacks for widgets closed during an interaction.
        if (!widgetLayouts[item.i] || (widgets && !widgets[item.i])) continue;
        if (
          storeLayout.some((entry) => entry.i === item.i) &&
          !currentById.has(item.i)
        )
          continue;
        const existing = currentById.get(item.i);
        const resolved = existing ?? widgetLayouts[item.i];
        if (resolved.isPinned || resolved.isLocked) continue;
        const h = resolved.isMinimized ? resolved.h : item.h;
        if (
          existing &&
          existing.x === item.x &&
          existing.y === item.y &&
          existing.w === item.w &&
          existing.h === h
        )
          continue;

        updates.set(item.i, {
          ...resolved,
          x: item.x,
          y: item.y,
          w: item.w,
          h,
        });
      }

      if (!updates.size) return;

      const updatedList = currentLayout.map(
        (item) => updates.get(item.i) ?? item
      );
      for (const [id, item] of updates) {
        if (!currentById.has(id)) updatedList.push(item);
      }

      setLayout(updatedList);
      onLayoutCommit?.(updatedList);
    },
    [
      currentBreakpoint,
      isEditable,
      onLayoutCommit,
      setLayout,
      storeLayout,
      widgetLayouts,
      widgets,
    ]
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
    if (Object.hasOwn(GRID_BREAKPOINTS, newBreakpoint)) {
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
