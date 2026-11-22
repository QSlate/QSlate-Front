'use client';

import { X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef } from 'react';

import { cn } from '@/shared/lib/class-names';
import { isEscapeConsumed, lockScroll } from '@/shared/lib/dom';

import { IconButton } from '../icon-button';

function isOutsideDialog(
  dialog: HTMLDialogElement,
  clientX: number,
  clientY: number
) {
  const bounds = dialog.getBoundingClientRect();
  return (
    clientX < bounds.left ||
    clientX > bounds.right ||
    clientY < bounds.top ||
    clientY > bounds.bottom
  );
}

export interface DialogProps {
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  /** One-line explanation under the title, linked via aria-describedby. */
  readonly description?: ReactNode | undefined;
  /** Actions rendered in a footer bar (e.g. Cancel / Confirm). */
  readonly footer?: ReactNode | undefined;
  readonly closeLabel?: string | undefined;
  readonly className?: string | undefined;
}

/**
 * Modal dialog built on the native `<dialog>` element: focus is moved inside
 * and contained by the browser, Escape and backdrop clicks request a close,
 * page scrolling is locked, and focus returns to the opener on unmount.
 */
export function Dialog({
  title,
  onClose,
  children,
  description,
  footer,
  closeLabel = 'Fermer',
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const pointerStartedOutside = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog?.showModal();
    const unlockScroll = lockScroll(document.body);
    return () => {
      dialog?.close();
      unlockScroll();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={cn(
        'm-auto max-h-[calc(100dvh-32px)] w-[var(--dialog-width,min(480px,calc(100vw-32px)))] max-w-[calc(100vw-16px)] overflow-auto overscroll-contain rounded-[20px] border border-[var(--dialog-border,var(--line-strong))] bg-[var(--dialog-surface,var(--raised))] p-0 text-[var(--dialog-text,var(--fg))] shadow-pop backdrop:bg-[var(--scrim)] backdrop:backdrop-blur-[4px]',
        className
      )}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        // Escape already closed a nested tooltip/popover: keep this open.
        if (isEscapeConsumed()) return;
        onClose();
      }}
      onPointerDown={(event) => {
        pointerStartedOutside.current =
          event.target === event.currentTarget &&
          isOutsideDialog(event.currentTarget, event.clientX, event.clientY);
      }}
      onPointerCancel={() => {
        pointerStartedOutside.current = false;
      }}
      onClick={(event) => {
        if (
          pointerStartedOutside.current &&
          event.target === event.currentTarget &&
          isOutsideDialog(event.currentTarget, event.clientX, event.clientY)
        )
          onClose();
        pointerStartedOutside.current = false;
      }}
    >
      <div className="p-[var(--dialog-padding,22px)]">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="m-0 text-[17px] font-semibold tracking-[-0.02em]"
            >
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-[12.5px] text-fg-2">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton
            icon={<X size={16} />}
            label={closeLabel}
            onClick={onClose}
          />
        </header>
        {children}
      </div>
      {footer ? (
        <footer className="flex items-center justify-end gap-2 border-t border-line px-6 py-3.5">
          {footer}
        </footer>
      ) : null}
    </dialog>
  );
}
