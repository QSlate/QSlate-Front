export type ClassValue = string | false | null | undefined;

/** Joins truthy class names with a single space. */
export function cn(...values: readonly ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}

/** Shared keyboard focus ring, visible only for keyboard navigation. */
export const FOCUS_RING =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';
