import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/class-names';

export type IconTileTone = 'brand' | 'gain' | 'loss' | 'vio' | 'amber';

export interface IconTileProps {
  readonly icon: ReactNode;
  readonly tone?: IconTileTone | undefined;
  readonly className?: string | undefined;
}

const TONE_CLASSES: Readonly<Record<IconTileTone, string>> = {
  brand: 'bg-brand-soft text-brand',
  gain: 'bg-gain-soft text-gain',
  loss: 'bg-loss-soft text-loss',
  vio: 'bg-vio-soft text-vio',
  amber: 'bg-amber-soft text-amber',
};

/** Coloured square icon identifying a widget type. */
export function IconTile({ icon, tone = 'brand', className }: IconTileProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-[26px] flex-none place-items-center rounded-lg [&_svg]:size-3.5',
        TONE_CLASSES[tone],
        className
      )}
    >
      {icon}
    </span>
  );
}
