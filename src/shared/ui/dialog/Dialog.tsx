'use client';

import { X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef } from 'react';

import styles from './Dialog.module.css';

const scrollLocks = new WeakMap<
  HTMLElement,
  { count: number; previousOverflow: string }
>();

function lockBodyScroll(body: HTMLElement) {
  const lock = scrollLocks.get(body) ?? {
    count: 0,
    previousOverflow: body.style.overflow,
  };
  lock.count += 1;
  scrollLocks.set(body, lock);
  body.style.overflow = 'hidden';

  return () => {
    lock.count -= 1;
    if (lock.count === 0) {
      body.style.overflow = lock.previousOverflow;
      scrollLocks.delete(body);
    }
  };
}

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

export function Dialog({
  title,
  onClose,
  children,
  className = '',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const pointerStartedOutside = useRef(false);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog?.showModal();
    const unlockBodyScroll = lockBodyScroll(document.body);
    return () => {
      dialog?.close();
      unlockBodyScroll();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${className}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
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
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
