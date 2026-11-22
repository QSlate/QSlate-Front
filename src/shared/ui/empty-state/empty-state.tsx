import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/class-names';

export interface EmptyStateProps {
  readonly title: string;
  readonly icon?: ReactNode | undefined;
  readonly description?: ReactNode | undefined;
  /** Call to action (usually a `<Button>`). */
  readonly action?: ReactNode | undefined;
  readonly className?: string | undefined;
}

/** Centered "nothing here yet" message with an optional next step. */
export function EmptyState({
  title,
  icon,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 p-4 text-center',
        className
      )}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className="mb-0.5 grid size-[38px] place-items-center rounded-xl border border-dashed border-line-strong bg-sunken text-fg-3 [&_svg]:size-[17px]"
        >
          {icon}
        </span>
      ) : null}
      <p className="m-0 text-[12.5px] font-semibold text-fg">{title}</p>
      {description ? (
        <p className="m-0 max-w-[300px] text-[11.5px] text-fg-3">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2.5">{action}</div> : null}
    </div>
  );
}
