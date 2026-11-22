import type { ComponentPropsWithRef, ReactNode } from 'react';

import { cn } from '@/shared/lib/class-names';

import { FIELD_CONTROL_CLASS, fieldFrameClassName } from './input-styles';

export interface InputProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'prefix'
> {
  /** Decorative content shown before the value (icon, currency). */
  readonly prefix?: ReactNode | undefined;
  /** Decorative content shown after the value (unit). */
  readonly suffix?: ReactNode | undefined;
  /** Marks the field invalid (red border + aria-invalid). */
  readonly invalid?: boolean | undefined;
  /** Use JetBrains Mono for figures, codes and identifiers. */
  readonly mono?: boolean | undefined;
  /** Class names applied to the outer frame. */
  readonly frameClassName?: string | undefined;
}

export function Input({
  prefix,
  suffix,
  invalid = false,
  mono = false,
  frameClassName,
  className,
  ...rest
}: InputProps) {
  return (
    <span className={fieldFrameClassName(invalid, frameClassName)}>
      {prefix ? (
        <span aria-hidden="true" className="inline-flex text-fg-3">
          {prefix}
        </span>
      ) : null}
      <input
        {...rest}
        aria-invalid={invalid || undefined}
        className={cn(
          FIELD_CONTROL_CLASS,
          mono && 'font-mono tabular-nums',
          className
        )}
      />
      {suffix ? (
        <span aria-hidden="true" className="shrink-0 text-[11px] text-fg-3">
          {suffix}
        </span>
      ) : null}
    </span>
  );
}
