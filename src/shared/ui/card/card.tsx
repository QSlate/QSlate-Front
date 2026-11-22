import { type ReactNode, useId } from 'react';

import { cn } from '@/shared/lib/class-names';

import { InfoTip } from '../tooltip';
import { IconTile, type IconTileTone } from './icon-tile';

export interface CardProps {
  readonly children: ReactNode;
  /** Widget title; when present the card renders a header. */
  readonly title?: string | undefined;
  readonly icon?: ReactNode | undefined;
  readonly tone?: IconTileTone | undefined;
  /** One-sentence explanation shown in an ⓘ tooltip next to the title. */
  readonly info?: string | undefined;
  /** Header actions (segmented control, menu button…). */
  readonly actions?: ReactNode | undefined;
  readonly className?: string | undefined;
  readonly bodyClassName?: string | undefined;
}

/** Widget shell: 16px radius, hairline border, top highlight, soft shadow. */
export function Card({
  children,
  title,
  icon,
  tone,
  info,
  actions,
  className,
  bodyClassName,
}: CardProps) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={cn(
        'relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface bg-card-hl text-fg shadow-card',
        className
      )}
    >
      {title ? (
        <header className="flex items-center gap-[9px] px-3.5 pb-1.5 pt-[13px]">
          {icon ? <IconTile icon={icon} tone={tone} /> : null}
          <h3
            id={titleId}
            className="m-0 truncate text-[13px] font-semibold tracking-[-0.005em]"
          >
            {title}
          </h3>
          {info ? (
            <InfoTip content={info} label={`À propos : ${title}`} />
          ) : null}
          <span className="flex-1" />
          {actions}
        </header>
      ) : null}
      <div
        className={cn(
          'relative min-h-0 flex-1',
          title ? 'px-3.5 pb-3' : 'p-3.5',
          bodyClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
