import type { ComponentPropsWithRef, ReactNode } from 'react';

import {
  type ButtonSize,
  type ButtonVariant,
  iconButtonClassName,
} from '../button';

export interface IconButtonProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'children' | 'aria-label'
> {
  /** Decorative icon; the accessible name comes from `label`. */
  readonly icon: ReactNode;
  /** Required accessible name, since the button has no visible text. */
  readonly label: string;
  readonly variant?: ButtonVariant | undefined;
  readonly size?: ButtonSize | undefined;
  /** Optional numeric badge (e.g. unread count), also added to the name. */
  readonly count?: number | undefined;
}

export function IconButton({
  icon,
  label,
  variant = 'quiet',
  size = 'md',
  count,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const hasCount = count !== undefined && count > 0;
  return (
    <button
      {...rest}
      type={type}
      aria-label={hasCount ? `${label} (${count})` : label}
      className={iconButtonClassName(variant, size, className)}
    >
      <span aria-hidden="true" className="relative inline-flex">
        {icon}
        {hasCount ? (
          <span className="absolute -right-2.5 -top-2 rounded-full bg-brand px-1.5 font-mono text-[10.5px] font-semibold leading-[17px] text-white">
            {count}
          </span>
        ) : null}
      </span>
    </button>
  );
}
