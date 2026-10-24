'use client';

import {
  GripVertical,
  Maximize2,
  Minus,
  Pin,
  PinOff,
  Plus,
  X,
} from 'lucide-react';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

import { useLayoutStore, type WidgetLayout } from '../model';

export interface WidgetContainerProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
  title: string;
  layout: WidgetLayout;
  children?: ReactNode;
  widgetContent?: ReactNode;
  onRemove?: ((id: string) => void) | undefined;
  onExpand?: ((id: string) => void) | undefined;
  icon?: ReactNode;
  toolbar?: ReactNode;
}

export const WidgetContainer = forwardRef<HTMLDivElement, WidgetContainerProps>(
  function WidgetContainer(
    {
      id,
      title,
      layout,
      children,
      widgetContent,
      onRemove,
      onExpand,
      icon,
      toolbar,
      className,
      ...rest
    },
    ref
  ) {
    const toggleWidgetPin = useLayoutStore((state) => state.toggleWidgetPin);
    const toggleWidgetMinimize = useLayoutStore(
      (state) => state.toggleWidgetMinimize
    );

    // Keep react-grid-layout's injected controls outside the widget body.
    const content = widgetContent === undefined ? children : widgetContent;
    const gridControls = widgetContent === undefined ? null : children;

    return (
      <div
        ref={ref}
        data-minimized={layout.isMinimized || undefined}
        data-pinned={layout.isPinned || undefined}
        className={`lab-widget group relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-default bg-card/95 backdrop-blur-sm shadow-sm transition-all duration-150 hover:border-hover ${
          layout.isPinned ? 'ring-1 ring-accent-border' : ''
        } ${className ?? ''}`}
        {...rest}
      >
        <div className="lab-widget-header flex h-9 shrink-0 items-center justify-between border-b border-default px-3 bg-panel/60">
          <div
            className="widget-drag-handle flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing select-none"
            data-testid="widget-drag-handle"
          >
            <GripVertical className="h-4 w-4 text-tertiary hover:text-primary transition-colors shrink-0" />
            {icon ? <span className="lab-widget-icon">{icon}</span> : null}
            <span className="lab-widget-title text-xs font-mono font-medium tracking-wide text-primary truncate">
              {title}
            </span>
            {layout.isPinned ? (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-dim text-gain border border-accent-border uppercase">
                Pinned
              </span>
            ) : null}
          </div>

          <div
            className="widget-action-bar widget-drag-cancel flex items-center gap-1 shrink-0 ml-2"
            data-testid="widget-action-bar"
          >
            {toolbar}
            <button
              type="button"
              onClick={() => toggleWidgetPin(id)}
              className={`lab-pin p-1 rounded text-tertiary hover:text-primary hover:bg-interactive-hover transition-colors ${
                layout.isPinned ? 'text-gain bg-accent-dim' : ''
              }`}
              title={layout.isPinned ? 'Unpin widget' : 'Pin widget'}
              aria-label={layout.isPinned ? 'Unpin widget' : 'Pin widget'}
              aria-pressed={Boolean(layout.isPinned)}
              data-testid="widget-pin-btn"
            >
              {layout.isPinned ? (
                <PinOff className="h-3.5 w-3.5" />
              ) : (
                <Pin className="h-3.5 w-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => toggleWidgetMinimize(id)}
              className="p-1 rounded text-tertiary hover:text-primary hover:bg-interactive-hover transition-colors"
              title={layout.isMinimized ? 'Expand widget' : 'Minimize widget'}
              aria-label={
                layout.isMinimized ? 'Expand widget' : 'Minimize widget'
              }
              aria-expanded={!layout.isMinimized}
              data-testid="widget-minimize-btn"
            >
              {layout.isMinimized ? (
                <Plus className="h-3.5 w-3.5" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
            </button>

            {onExpand ? (
              <button
                type="button"
                className="lab-icon-button"
                aria-label={`Expand ${title}`}
                title="Expand widget"
                onClick={() => onExpand(id)}
              >
                <Maximize2 size={12} />
              </button>
            ) : null}
            {onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(id)}
                className="p-1 rounded text-tertiary hover:text-loss hover:bg-loss/10 transition-colors"
                title="Remove widget"
                aria-label="Remove widget"
                data-testid="widget-remove-btn"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {!layout.isMinimized ? (
          <div
            className="lab-widget-content flex-1 min-h-0 overflow-hidden flex flex-col p-2"
            data-testid="widget-content"
          >
            {content}
          </div>
        ) : null}
        {gridControls}
      </div>
    );
  }
);
