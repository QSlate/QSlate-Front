'use client';

import 'react-grid-layout/css/styles.css';
import './DynamicGrid.css';

import { Responsive, useContainerWidth } from 'react-grid-layout';

import { WidgetContainer } from '@/entities/layout/ui';
import { DrawdownWidget } from '@/shared/ui/device-showcase/widgets/drawdown';
import { EquityCurveWidget } from '@/shared/ui/device-showcase/widgets/equity-curve';
import { MiniIdeWidget } from '@/shared/ui/device-showcase/widgets/mini-ide';

import { useGridSync } from '../model/useGridSync';
import {
  type DynamicGridProps,
  GRID_BREAKPOINTS,
  GRID_COLS,
  GRID_CONTAINER_PADDING,
  GRID_MARGIN,
  GRID_ROW_HEIGHT,
  type WidgetDefinition,
} from '../types';
import { GridSkeleton } from './GridSkeleton';

const DEFAULT_WIDGETS: Record<string, WidgetDefinition> = {
  'mini-ide': {
    id: 'mini-ide',
    title: 'Strategy IDE · Python',
    component: MiniIdeWidget,
  },
  'equity-curve': {
    id: 'equity-curve',
    title: 'Equity Curve · Performance',
    component: EquityCurveWidget,
  },
  drawdown: {
    id: 'drawdown',
    title: 'Underwater Drawdown',
    component: DrawdownWidget,
  },
};

export function DynamicGrid({
  widgets = DEFAULT_WIDGETS,
  className,
  isEditable = true,
  onLayoutCommit,
}: DynamicGridProps) {
  const { width, mounted, containerRef } = useContainerWidth({
    measureBeforeMount: false,
    initialWidth: 1200,
  });

  const {
    layouts,
    rglLayouts,
    handleDragStop,
    handleResizeStop,
    handleBreakpointChange,
  } = useGridSync({
    widgets,
    isEditable,
    onLayoutCommit,
  });

  return (
    <div
      ref={containerRef}
      className={`qslate-dynamic-grid w-full relative min-h-[400px] ${className ?? ''}`}
      data-testid="dynamic-grid-container"
    >
      {mounted && width > 0 ? (
        <Responsive
          width={width}
          layouts={rglLayouts}
          breakpoints={GRID_BREAKPOINTS}
          cols={GRID_COLS}
          rowHeight={GRID_ROW_HEIGHT}
          margin={GRID_MARGIN}
          containerPadding={GRID_CONTAINER_PADDING}
          dragConfig={{
            enabled: isEditable,
            handle: '.widget-drag-handle',
            cancel: '.widget-drag-cancel',
            threshold: 3,
          }}
          resizeConfig={{
            enabled: isEditable,
            handles: ['se'],
          }}
          onDragStop={handleDragStop}
          onResizeStop={handleResizeStop}
          onBreakpointChange={handleBreakpointChange}
        >
          {Object.entries(widgets).map(([id, widget]) => {
            const layout = layouts[id] ?? {
              id,
              x: 0,
              y: 0,
              w: 4,
              h: 4,
            };
            const Component = widget.component;

            return (
              <WidgetContainer
                key={id}
                id={id}
                title={widget.title}
                layout={layout}
              >
                <Component id={id} />
              </WidgetContainer>
            );
          })}
        </Responsive>
      ) : (
        <GridSkeleton />
      )}
    </div>
  );
}
