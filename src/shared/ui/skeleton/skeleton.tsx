import { cn } from '@/shared/lib/class-names';

export interface SkeletonProps {
  readonly className?: string | undefined;
}

/** Shimmering placeholder; size it with utility classes (h-*, w-*). */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block rounded-[10px] bg-[linear-gradient(100deg,var(--sunken)_20%,color-mix(in_srgb,var(--brand)_10%,var(--sunken))_40%,var(--sunken)_60%)] bg-[length:220%_100%] animate-[qs-shimmer_1.5s_ease-in-out_infinite] motion-reduce:animate-none',
        className
      )}
    />
  );
}
