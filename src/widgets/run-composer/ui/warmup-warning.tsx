'use client';

import { TriangleAlert } from 'lucide-react';

import type { WarmupShortfall } from '@/features/compose-backtest';
import { cn } from '@/shared/lib/class-names';
import { Button } from '@/shared/ui';

const COUNT = new Intl.NumberFormat('fr-FR');

interface WarmupWarningProps {
  readonly warmup: WarmupShortfall;
  readonly onFix: (window: number) => void;
  readonly disabled?: boolean | undefined;
  readonly className?: string | undefined;
}

/**
 * "Slow period (200) dépasse l'historique de chauffe": the indicator is
 * never ready, so the strategy would not trade. One click raises the window.
 */
export function WarmupWarning({
  warmup,
  onFix,
  disabled,
  className,
}: WarmupWarningProps) {
  const period = COUNT.format(warmup.period);
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-[10px] border border-[color-mix(in_srgb,var(--warn)_35%,transparent)] bg-warn-soft px-3 py-2 text-xs text-fg-2',
        className
      )}
    >
      <TriangleAlert size={14} aria-hidden="true" className="text-warn" />
      <span className="min-w-0 flex-1">
        {warmup.parameter} (<span className="font-mono">{period}</span>) dépasse
        l&apos;historique de chauffe : la stratégie risque de ne jamais trader.
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => onFix(warmup.period)}
      >
        Ajuster à <span className="font-mono">{period}</span>
      </Button>
    </div>
  );
}
