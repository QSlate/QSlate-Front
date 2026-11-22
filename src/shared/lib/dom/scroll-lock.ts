const scrollLocks = new WeakMap<
  HTMLElement,
  { count: number; previousOverflow: string }
>();

/**
 * Locks scrolling on `element` until every caller released its lock,
 * restoring the overflow value that was set before the first lock.
 */
export function lockScroll(element: HTMLElement): () => void {
  const lock = scrollLocks.get(element) ?? {
    count: 0,
    previousOverflow: element.style.overflow,
  };
  lock.count += 1;
  scrollLocks.set(element, lock);
  element.style.overflow = 'hidden';

  return () => {
    lock.count -= 1;
    if (lock.count === 0) {
      element.style.overflow = lock.previousOverflow;
      scrollLocks.delete(element);
    }
  };
}
