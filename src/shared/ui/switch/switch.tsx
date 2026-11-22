import type { ComponentPropsWithRef } from 'react';

import { cn, FOCUS_RING } from '@/shared/lib/class-names';

export interface SwitchProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'onChange' | 'role' | 'aria-checked' | 'children'
> {
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
}

/** On/off toggle exposed as role="switch"; name it with aria-label(ledby). */
export function Switch({
  checked,
  onCheckedChange,
  className,
  type = 'button',
  ...rest
}: SwitchProps) {
  return (
    <button
      {...rest}
      type={type}
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        FOCUS_RING,
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-brand' : 'bg-line-strong',
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'block size-4 rounded-full bg-white shadow-card transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}
