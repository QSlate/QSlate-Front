'use client';

import { X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef } from 'react';

import { cn } from '@/shared/lib/class-names';
import { isEscapeConsumed, lockScroll } from '@/shared/lib/dom';

import { IconButton } from '../icon-button';

export interface DrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
  /** Optional icon tile or badge shown before the title. */
  readonly icon?: ReactNode | undefined;
  readonly description?: ReactNode | undefined;
  /** Sticky footer actions (e.g. Annuler / Appliquer). */
  readonly footer?: ReactNode | undefined;
  readonly closeLabel?: string | undefined;
  readonly className?: string | undefined;
}

/**
 * Right-hand side panel built on a modal `<dialog>`: the rest of the page is
 * inert (focus stays inside), Escape and backdrop clicks close it, and focus
 * returns to the element that opened it.
 */
export function Drawer({ open, ...props }: DrawerProps) {
  return open ? <DrawerPanel {...props} /> : null;
}

function DrawerPanel({
  onClose,
  title,
  children,
  icon,
  description,
  footer,
  closeLabel = 'Fermer le panneau',
  className,
}: Omit<DrawerProps, 'open'>) {
  const ref = useRef<HTMLDialogElement>(null);
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
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        // Escape already closed a nested tooltip/popover: keep this open.
        if (isEscapeConsumed()) return;
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        'fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-[384px] max-w-full border-0 border-l border-line-strong bg-[color-mix(in_srgb,var(--raised)_92%,transparent)] p-0 text-fg shadow-pop backdrop-blur-[18px] backdrop:bg-[var(--scrim)]',
        className
      )}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-2.5 border-b border-line px-[18px] py-4">
          {icon}
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="m-0 text-[14.5px] font-semibold tracking-[-0.01em]"
            >
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-0.5 text-xs text-fg-3">
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
        <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-[18px] py-4">
          {children}
        </div>
        {footer ? (
          <footer className="flex justify-end gap-2 border-t border-line px-[18px] py-3.5">
            {footer}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
