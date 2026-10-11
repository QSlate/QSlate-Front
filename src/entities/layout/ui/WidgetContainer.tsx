'use client';

import { GripVertical, Minus, Pin, PinOff, Plus, X } from 'lucide-react';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

import { useLayoutStore, type WidgetLayout } from '../model';

export interface WidgetContainerProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
  title: string;
  layout: WidgetLayout;
  children: ReactNode;
  onRemove?: ((id: string) => void) | undefined;
}

export const WidgetContainer = forwardRef<HTMLDivElement, WidgetContainerProps>(
  function WidgetContainer(
    { id, title, layout, children, onRemove, className, ...rest },
    ref
  ) {
    const toggleWidgetPin = useLayoutStore((state) => state.toggleWidgetPin);
    const toggleWidgetMinimize = useLayoutStore(
      (state) => state.toggleWidgetMinimize
    );

    return (
      <div
        ref={ref}
        className={`group relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-default bg-card/95 backdrop-blur-sm shadow-sm transition-all duration-150 hover:border-hover ${
          layout.isPinned ? 'ring-1 ring-accent-border' : ''
        } ${className ?? ''}`}
        {...rest}
      >
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-default px-3 bg-panel/60">
          <div
            className="widget-drag-handle flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing select-none"
            data-testid="widget-drag-handle"
          >
            <GripVertical className="h-4 w-4 text-tertiary hover:text-primary transition-colors shrink-0" />
            <span className="text-xs font-mono font-medium tracking-wide text-primary truncate">
              {title}
            </span>
            {layout.isPinned ? (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-dim text-gain border border-accent-border uppercase">
                Pinned
              </span>
            ) : null}
          </div>

          <div
            className="widget-drag-cancel flex items-center gap-1 shrink-0 ml-2"
            data-testid="widget-action-bar"
          >
            <button
              type="button"
              onClick={() => toggleWidgetPin(id)}
              className={`p-1 rounded text-tertiary hover:text-primary hover:bg-interactive-hover transition-colors ${
                layout.isPinned ? 'text-gain bg-accent-dim' : ''
              }`}
              title={layout.isPinned ? 'Unpin widget' : 'Pin widget'}
              aria-label={layout.isPinned ? 'Unpin widget' : 'Pin widget'}
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
              data-testid="widget-minimize-btn"
            >
              {layout.isMinimized ? (
                <Plus className="h-3.5 w-3.5" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
            </button>

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
            className="flex-1 min-h-0 overflow-auto p-3"
            data-testid="widget-content"
          >
            {children}
          </div>
        ) : null}
      </div>
    );
  }
);
