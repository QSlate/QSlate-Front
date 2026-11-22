'use client';

import 'react-grid-layout/css/styles.css';

import { useState } from 'react';
import {
  GridLayout,
  type Layout,
  type LayoutItem,
  useContainerWidth,
} from 'react-grid-layout';

import { findLabWidget, type LabWidgetType } from '@/entities/widget';
import {
  type DashboardLayout,
  fromGridLayout,
  GRID_COLUMNS,
  moveDashboardWidget,
  resizeDashboardWidget,
} from '@/features/customize-lab';
import { cn } from '@/shared/lib/class-names';

import type { WidgetComponents } from '../model/types';
import { GRIP_CLASS, WidgetCard } from './widget-card';

export const ROW_HEIGHT = 44;
const MARGIN = 12;
/** Below this width widgets stack in reading order (no editing). */
const STACK_BELOW_PX = 768;

export interface DashboardGridProps {
  readonly layout: DashboardLayout;
  readonly editing: boolean;
  readonly components: WidgetComponents;
  readonly onChange: (layout: DashboardLayout) => void;
  readonly onRemove: (type: LabWidgetType) => void;
}

function toGrid(layout: DashboardLayout, editing: boolean): Layout {
  return layout.map((item) => {
    const widget = findLabWidget(item.i);
    return {
      ...item,
      minW: widget?.minSize.w ?? 1,
      minH: widget?.minSize.h ?? 1,
      static: !editing,
    };
  });
}

function ResizeCorner() {
  return (
    <span
      aria-hidden="true"
      className="react-resizable-handle absolute bottom-1.5 right-1.5 z-[3] size-3.5 cursor-se-resize rounded-br-[5px] border-b-[2.5px] border-r-[2.5px] border-brand"
    />
  );
}

/** react-grid-layout dashboard: drag by the grip, resize by the corner. */
export function DashboardGrid({
  layout,
  editing,
  components,
  onChange,
  onRemove,
}: DashboardGridProps) {
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: false,
    initialWidth: 1200,
  });
  const [resizing, setResizing] = useState<LayoutItem | null>(null);

  const ordered = [...layout].sort((a, b) => a.y - b.y || a.x - b.x);
  const stacked = mounted && width < STACK_BELOW_PX;

  const card = (type: LabWidgetType, badge: string | null) => {
    const widget = findLabWidget(type);
    if (!widget) return null;
    const Content = components[type];
    return (
      <WidgetCard
        widget={widget}
        editing={editing && !stacked}
        sizeBadge={badge}
        onRemove={() => onRemove(type)}
        onKeyboardChange={(kind, dx, dy) =>
          onChange(
            kind === 'move'
              ? moveDashboardWidget(layout, type, dx, dy)
              : resizeDashboardWidget(layout, type, dx, dy)
          )
        }
      >
        <Content />
      </WidgetCard>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {stacked ? (
        <div className="flex flex-col gap-3">
          {ordered.map((item) => (
            <div
              key={item.i}
              // Mobile keeps each widget's height in rows.
              style={{ height: item.h * ROW_HEIGHT + (item.h - 1) * MARGIN }}
            >
              {card(item.i, null)}
            </div>
          ))}
        </div>
      ) : mounted && width > 0 ? (
        <GridLayout
          width={width}
          layout={toGrid(layout, editing)}
          gridConfig={{
            cols: GRID_COLUMNS,
            rowHeight: ROW_HEIGHT,
            margin: [MARGIN, MARGIN],
            containerPadding: [0, 0],
          }}
          dragConfig={{
            enabled: editing,
            handle: `.${GRIP_CLASS}`,
            threshold: 3,
          }}
          resizeConfig={{
            enabled: editing,
            handles: ['se'],
            handleComponent: <ResizeCorner />,
          }}
          onDragStop={(next) => onChange(fromGridLayout(next))}
          onResize={(_layout, _old, item) => setResizing(item)}
          onResizeStop={(next) => {
            setResizing(null);
            onChange(fromGridLayout(next));
          }}
          className={cn(editing && 'qs-dashboard-editing')}
        >
          {layout.map((item) => {
            const live = resizing?.i === item.i ? resizing : item;
            return (
              <div key={item.i} className="min-h-0 min-w-0">
                {card(item.i, `${live.w} × ${live.h}`)}
              </div>
            );
          })}
        </GridLayout>
      ) : null}
    </div>
  );
}
