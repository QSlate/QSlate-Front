'use client';

import { Info } from 'lucide-react';
import { type ReactNode, useEffect, useId, useState } from 'react';

import { cn, FOCUS_RING } from '@/shared/lib/class-names';
import { consumeEscape } from '@/shared/lib/dom';

export type TooltipSide = 'top' | 'bottom' | 'right';

/** Props to spread on the focusable trigger element. */
export interface TooltipTriggerProps {
  readonly 'aria-describedby': string | undefined;
}

export interface TooltipProps {
  /** Tooltip text: one or two sentences, no interactive content. */
  readonly content: ReactNode;
  /** Render prop receiving the ARIA props for the focusable trigger. */
  readonly children: (triggerProps: TooltipTriggerProps) => ReactNode;
  readonly side?: TooltipSide | undefined;
  readonly className?: string | undefined;
}

// Each side also draws an invisible bridge (::before) over the gap between
// trigger and bubble, so moving the pointer onto the bubble keeps it open.
const SIDE_CLASSES: Readonly<Record<TooltipSide, string>> = {
  bottom:
    'left-1/2 top-[calc(100%+8px)] -translate-x-1/2 before:inset-x-0 before:-top-2 before:h-2',
  top: 'bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 before:inset-x-0 before:-bottom-2 before:h-2',
  right:
    'left-[calc(100%+10px)] top-1/2 -translate-y-1/2 before:inset-y-0 before:-left-2.5 before:w-2.5',
};

/**
 * Accessible tooltip (WCAG 1.4.13): opens on hover and keyboard focus,
 * stays open while the pointer moves onto the bubble, and closes on blur,
 * pointer leave or Escape (without closing an enclosing modal).
 */
export function Tooltip({
  content,
  children,
  side = 'bottom',
  className,
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  // Single Escape handler, active only while open. It runs in the capture
  // phase and consumes the key so an enclosing Dialog/Drawer stays open.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      consumeEscape(event);
      setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open]);

  return (
    <span
      className={cn('relative inline-flex', className)}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children({ 'aria-describedby': open ? id : undefined })}
      {open ? (
        <span
          role="tooltip"
          id={id}
          className={cn(
            'absolute z-40 w-max before:absolute max-w-[250px] whitespace-normal rounded-[9px] bg-fg px-[11px] py-[9px] text-left text-xs font-normal leading-normal text-canvas shadow-pop',
            SIDE_CLASSES[side]
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}

export interface InfoTipProps {
  /** Explanation shown in the tooltip. */
  readonly content: ReactNode;
  /** Accessible name of the trigger, e.g. "À propos du ratio de Sharpe". */
  readonly label: string;
  readonly side?: TooltipSide | undefined;
}

/** Small focusable ⓘ trigger used next to widget titles and KPI labels. */
export function InfoTip({ content, label, side }: InfoTipProps) {
  return (
    <Tooltip content={content} side={side}>
      {(triggerProps) => (
        <button
          type="button"
          aria-label={label}
          {...triggerProps}
          className={cn(
            FOCUS_RING,
            'inline-grid cursor-help place-items-center rounded-full border-0 bg-transparent p-0 text-fg-3 hover:text-fg-2'
          )}
        >
          <Info size={13} aria-hidden="true" />
        </button>
      )}
    </Tooltip>
  );
}
