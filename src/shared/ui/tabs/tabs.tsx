'use client';

import { type KeyboardEvent, type ReactNode, useId, useRef } from 'react';

import { nextRovingIndex } from '@/shared/lib/a11y';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';

export interface TabItem<T extends string> {
  readonly id: T;
  readonly label: ReactNode;
  readonly panel: ReactNode;
}

export interface TabsProps<T extends string> {
  /** Accessible name of the tab list. */
  readonly label: string;
  readonly items: readonly TabItem<T>[];
  readonly value: T;
  readonly onValueChange: (value: T) => void;
  readonly className?: string | undefined;
  readonly panelClassName?: string | undefined;
}

export function Tabs<T extends string>({
  label,
  items,
  value,
  onValueChange,
  className,
  panelClassName,
}: TabsProps<T>) {
  const baseId = useId();
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = Math.max(
    items.findIndex((item) => item.id === value),
    0
  );
  const active = items[activeIndex];

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const next = nextRovingIndex(event.key, activeIndex, items.length);
    if (next === null) return;
    event.preventDefault();
    const target = items[next];
    if (!target) return;
    onValueChange(target.id);
    tabsRef.current[next]?.focus();
  };

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="flex gap-0.5">
        {items.map((item, index) => {
          const selected = index === activeIndex;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabsRef.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={
                selected ? `${baseId}-panel-${item.id}` : undefined
              }
              tabIndex={selected ? 0 : -1}
              onClick={() => onValueChange(item.id)}
              onKeyDown={handleKeyDown}
              className={cn(
                FOCUS_RING,
                'cursor-pointer rounded-lg border-0 px-2.5 py-[5px] text-[12px] font-medium transition-colors',
                selected
                  ? 'bg-surface text-fg shadow-card'
                  : 'bg-transparent text-fg-3 hover:text-fg-2'
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {active ? (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active.id}`}
          aria-labelledby={`${baseId}-tab-${active.id}`}
          tabIndex={0}
          className={cn(FOCUS_RING, panelClassName)}
        >
          {active.panel}
        </div>
      ) : null}
    </div>
  );
}
