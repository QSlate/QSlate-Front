'use client';

import { GripVertical, X } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';

import type { LabWidgetDefinition } from '@/entities/widget';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';
import { IconTile, InfoTip } from '@/shared/ui';

import { WidgetIcon } from './widget-icon';

export const GRIP_CLASS = 'qs-widget-grip';

interface WidgetCardProps {
  readonly widget: LabWidgetDefinition;
  readonly editing: boolean;
  /** Size shown on the corner badge while resizing ("6 × 4"). */
  readonly sizeBadge?: string | null | undefined;
  readonly onRemove: () => void;
  /** Arrow keys on the grip: move (or resize with Shift). */
  readonly onKeyboardChange: (
    kind: 'move' | 'resize',
    dx: number,
    dy: number
  ) => void;
  readonly children: ReactNode;
}

const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** Card frame of a dashboard widget (header, tooltip, edit handles). */
export function WidgetCard({
  widget,
  editing,
  sizeBadge,
  onRemove,
  onKeyboardChange,
  children,
}: WidgetCardProps) {
  const onGripKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const delta = ARROWS[event.key];
    if (delta) {
      event.preventDefault();
      onKeyboardChange(event.shiftKey ? 'resize' : 'move', delta[0], delta[1]);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onRemove();
    }
  };

  return (
    <section
      aria-label={widget.title}
      className={cn(
        'relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-[var(--card-hl),var(--surface)] shadow-card',
        editing &&
          'outline-dashed outline-[1.5px] -outline-offset-1 outline-brand-line'
      )}
    >
      <header className="flex items-center gap-[9px] px-3.5 pb-1.5 pt-[13px]">
        {editing ? (
          <button
            type="button"
            aria-label={`Déplacer ${widget.title}`}
            aria-describedby="qs-dashboard-keys"
            onKeyDown={onGripKey}
            className={cn(
              GRIP_CLASS,
              FOCUS_RING,
              'grid size-6 shrink-0 cursor-grab place-items-center rounded-[7px] border border-line bg-sunken text-fg-3 active:cursor-grabbing'
            )}
          >
            <GripVertical size={13} aria-hidden="true" />
          </button>
        ) : null}
        <IconTile
          icon={<WidgetIcon type={widget.type} />}
          tone={widget.tone}
          className="size-[26px] rounded-lg [&_svg]:size-3.5"
        />
        <h3 className="m-0 truncate text-[13px] font-semibold tracking-[-0.005em] text-fg">
          {widget.title}
        </h3>
        <InfoTip
          content={widget.description}
          label={`À propos : ${widget.title}`}
        />
        <span className="flex-1" />
        {editing ? (
          <button
            type="button"
            aria-label={`Retirer ${widget.title}`}
            onClick={onRemove}
            className={cn(
              FOCUS_RING,
              'grid size-6 shrink-0 place-items-center rounded-[7px] border border-line bg-sunken text-fg-3 hover:text-loss'
            )}
          >
            <X size={13} aria-hidden="true" />
          </button>
        ) : null}
      </header>
      <div className="relative min-h-0 flex-1 px-3.5 pb-3">{children}</div>
      {editing && sizeBadge ? (
        <span
          aria-hidden="true"
          className="absolute bottom-1.5 right-[26px] z-[3] rounded-md border border-brand-line bg-brand-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand"
        >
          {sizeBadge}
        </span>
      ) : null}
    </section>
  );
}
