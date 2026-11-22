import { cn, FOCUS_RING } from '@/shared/lib/class-names';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Readonly<Record<ButtonVariant, string>> = {
  primary:
    'border-0 bg-brand-gradient font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_8px_22px_-8px_var(--glow),0_0_0_1px_var(--brand-line)] hover:brightness-110',
  secondary:
    'border border-line bg-surface text-fg shadow-card hover:border-line-strong hover:bg-raised',
  quiet:
    'border border-transparent bg-transparent text-fg-2 hover:bg-sunken hover:text-fg',
  danger: 'border border-loss bg-loss-soft font-semibold text-loss',
};

const SIZE_CLASSES: Readonly<Record<ButtonSize, string>> = {
  sm: 'h-7 gap-1.5 rounded-lg px-2.5 text-xs',
  md: 'h-[34px] gap-[7px] rounded-[10px] px-[13px] text-[13px]',
  lg: 'h-10 gap-2 rounded-xl px-5 text-sm',
};

const ICON_SIZE_CLASSES: Readonly<Record<ButtonSize, string>> = {
  sm: 'size-7 rounded-lg',
  md: 'size-[34px] rounded-[10px]',
  lg: 'size-10 rounded-xl',
};

const BASE_CLASSES =
  'inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap font-medium transition-[background-color,border-color,color,filter] disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:brightness-100 [&_svg]:shrink-0';

export function buttonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string
): string {
  return cn(
    BASE_CLASSES,
    FOCUS_RING,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className
  );
}

export function iconButtonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string
): string {
  return cn(
    BASE_CLASSES,
    FOCUS_RING,
    VARIANT_CLASSES[variant],
    ICON_SIZE_CLASSES[size],
    className
  );
}
