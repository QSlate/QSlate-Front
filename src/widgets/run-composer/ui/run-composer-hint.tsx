'use client';

import { Info } from 'lucide-react';
import Link from 'next/link';

import { useRunComposer } from '../model/use-run-composer';

export const RUN_COMPOSER_HINT_ID = 'run-composer-hint';

/** Inline explanation of why "Lancer" is unavailable, with the next step. */
export function RunComposerHint() {
  const { blockReason, isRunning } = useRunComposer();
  if (isRunning || !blockReason) return null;

  return (
    <p
      id={RUN_COMPOSER_HINT_ID}
      role="status"
      className="m-0 flex flex-wrap items-center gap-2 px-[22px] pt-3 text-xs text-fg-2"
    >
      <Info size={14} aria-hidden="true" className="text-fg-3" />
      <span>{blockReason.message}</span>
      {blockReason.href ? (
        <Link
          href={blockReason.href}
          className="font-medium text-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {blockReason.linkLabel}
        </Link>
      ) : null}
    </p>
  );
}
