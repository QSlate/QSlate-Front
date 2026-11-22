let escapeConsumed = false;

/**
 * Marks an Escape key press as handled by a transient layer (tooltip,
 * popover) so enclosing modal layers do not also close on the same press.
 * Native `<dialog>` elements receive their `cancel` event after the keydown,
 * hence the flag lives until the current task ends.
 */
export function consumeEscape(event: KeyboardEvent): void {
  event.preventDefault();
  event.stopPropagation();
  escapeConsumed = true;
  setTimeout(() => {
    escapeConsumed = false;
  }, 0);
}

/** True while the current Escape press was already handled by a layer. */
export function isEscapeConsumed(): boolean {
  return escapeConsumed;
}
