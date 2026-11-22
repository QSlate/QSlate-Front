'use client';

import { type KeyboardEvent, type ReactNode, useRef } from 'react';

import { nextRovingIndex } from '@/shared/lib/a11y';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: ReactNode;
  /** Accessible name when `label` is not plain text (e.g. an icon). */
  readonly ariaLabel?: string | undefined;
  readonly disabled?: boolean | undefined;
}

export interface SegmentedControlProps<T extends string> {
  /** Accessible name of the group. */
  readonly label: string;
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onValueChange: (value: T) => void;
  readonly size?: 'sm' | 'md' | undefined;
  /** Render option labels in JetBrains Mono (timeframes, ranges). */
  readonly mono?: boolean | undefined;
  readonly className?: string | undefined;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onValueChange,
  size = 'md',
  mono = false,
  className,
}: SegmentedControlProps<T>) {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.filter((option) => !option.disabled);
  const selectedIndex = enabled.findIndex((option) => option.value === value);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const next = nextRovingIndex(
      event.key,
      Math.max(selectedIndex, 0),
      enabled.length
    );
    if (next === null) return;
    event.preventDefault();
    const target = enabled[next];
    if (!target) return;
    onValueChange(target.value);
    const position = options.indexOf(target);
    buttonsRef.current[position]?.focus();
  };

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex flex-wrap border border-line bg-sunken',
        size === 'sm'
          ? 'gap-px rounded-lg p-0.5'
          : 'gap-0.5 rounded-[10px] p-[3px]',
        className
      )}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const focusable =
          selected || (selectedIndex === -1 && option === enabled[0]);
        return (
          <button
            key={option.value}
            ref={(node) => {
              buttonsRef.current[index] = node;
            }}
            type="button"
            aria-pressed={selected}
            aria-label={option.ariaLabel}
            disabled={option.disabled}
            tabIndex={focusable ? 0 : -1}
            onClick={() => onValueChange(option.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              FOCUS_RING,
              'inline-flex cursor-pointer items-center gap-1.5 border-0 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              size === 'sm'
                ? 'rounded-md px-2 py-[3px] text-[10.5px]'
                : 'rounded-[7px] px-3 py-1.5 text-[13px]',
              mono && 'font-mono',
              selected
                ? 'bg-surface text-fg shadow-card'
                : 'bg-transparent text-fg-2 hover:text-fg'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
