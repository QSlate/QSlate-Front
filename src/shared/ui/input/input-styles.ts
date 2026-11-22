import { cn } from '@/shared/lib/class-names';

/** Field frame shared by text, number and select controls. */
export function fieldFrameClassName(
  invalid: boolean,
  className?: string
): string {
  return cn(
    'relative flex h-[34px] min-w-0 items-center gap-1.5 rounded-[9px] border bg-surface px-2.5 text-[12.5px] text-fg transition-[border-color,box-shadow]',
    'focus-within:border-brand-line focus-within:shadow-[0_0_0_3px_var(--brand-soft)]',
    'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
    invalid ? 'border-loss' : 'border-line hover:border-line-strong',
    className
  );
}

export const FIELD_CONTROL_CLASS =
  'h-full w-full min-w-0 flex-1 border-0 bg-transparent p-0 text-inherit outline-none placeholder:text-fg-3 disabled:cursor-not-allowed';
