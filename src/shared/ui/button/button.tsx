import { Loader2 } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import {
  buttonClassName,
  type ButtonSize,
  type ButtonVariant,
} from './button-styles';

export interface ButtonProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'children'
> {
  readonly children: ReactNode;
  readonly variant?: ButtonVariant | undefined;
  readonly size?: ButtonSize | undefined;
  /** Icon rendered before the label (decorative). */
  readonly leadingIcon?: ReactNode | undefined;
  /** Icon or hint (e.g. `<Kbd>`) rendered after the label. */
  readonly trailing?: ReactNode | undefined;
  /** Shows a spinner, disables the button and marks it busy. */
  readonly loading?: boolean | undefined;
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  leadingIcon,
  trailing,
  loading = false,
  disabled,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      className={buttonClassName(variant, size, className)}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" aria-hidden="true" />
      ) : leadingIcon ? (
        <span aria-hidden="true" className="inline-flex">
          {leadingIcon}
        </span>
      ) : null}
      {children}
      {trailing}
    </button>
  );
}
