import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/class-names';

export interface KbdProps {
  readonly children: ReactNode;
  readonly className?: string | undefined;
}

/** Keyboard shortcut hint, e.g. `<Kbd>⌘↵</Kbd>`. */
export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        'rounded px-[5px] py-px font-mono text-[10.5px] font-medium opacity-80 [background:color-mix(in_srgb,currentColor_16%,transparent)]',
        className
      )}
    >
      {children}
    </kbd>
  );
}
