'use client';

import { Info } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/shared/lib/class-names';

import { useComposerNotice } from '../model/composer-notice';
import { useRunComposer } from '../model/use-run-composer';
import { WarmupWarning } from './warmup-warning';

export const RUN_COMPOSER_HINT_ID = 'run-composer-hint';

/**
 * Live region under the header: why "Lancer" is unavailable (with the next
 * step), or short feedback such as a shortcut pressed while a run is active.
 * It stays mounted so screen readers announce every change. A warm-up
 * window shorter than a strategy period gets a one-click fix below it.
 */
export function RunComposerHint() {
  const { blockReason, isRunning, warmup, update } = useRunComposer();
  const notice = useComposerNotice((state) => state.notice);
  const reason = isRunning ? null : blockReason;
  const message = notice ?? reason?.message ?? null;

  return (
    <>
      <p
        id={RUN_COMPOSER_HINT_ID}
        role="status"
        className={cn(
          'm-0',
          message
            ? 'flex flex-wrap items-center gap-2 px-[22px] pt-3 text-xs text-fg-2'
            : 'sr-only'
        )}
      >
        {message ? (
          <>
            <Info size={14} aria-hidden="true" className="text-fg-3" />
            <span>{message}</span>
            {!notice && reason?.href ? (
              <Link
                href={reason.href}
                className="font-medium text-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {reason.linkLabel}
              </Link>
            ) : null}
          </>
        ) : null}
      </p>
      {warmup && !isRunning ? (
        <WarmupWarning
          warmup={warmup}
          onFix={(window) => update({ window })}
          className="mx-[22px] mt-3"
        />
      ) : null}
    </>
  );
}
