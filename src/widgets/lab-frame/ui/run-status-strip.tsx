'use client';

import type { ReactNode } from 'react';

import { useBacktest } from '@/features/run-backtest';
import { cn } from '@/shared/lib/class-names';

import { useRunSummary } from '../model/run-summary';
import {
  formatAgo,
  formatDuration,
  formatElapsed,
  useNow,
} from '../model/run-timing';

type PillTone = 'idle' | 'run' | 'ok';

interface StatusPillProps {
  readonly tone: PillTone;
  readonly children: ReactNode;
}

function StatusPill({ tone, children }: StatusPillProps) {
  return (
    <span
      role="status"
      className={cn(
        'inline-flex h-[26px] shrink-0 items-center gap-[7px] rounded-full border bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] px-2.5 font-medium',
        tone === 'run' ? 'border-brand-line text-fg' : 'border-line text-fg-2'
      )}
    >
      <i
        aria-hidden="true"
        className={cn(
          'size-[7px] rounded-full',
          tone === 'idle' && 'bg-fg-3',
          tone === 'ok' && 'bg-gain shadow-[0_0_8px_var(--gain)]',
          tone === 'run' &&
            'animate-[qs-pulse_1.4s_ease-in-out_infinite] bg-a2 shadow-[0_0_0_3px_var(--brand-soft),0_0_10px_var(--a2)] motion-reduce:animate-none'
        )}
      />
      {children}
    </span>
  );
}

export interface RunStatusStripProps {
  /** Right-aligned content (dashboard tabs). */
  readonly children?: ReactNode | undefined;
}

/**
 * Status line above the dashboard: idle, live progress (percentage, elapsed
 * time, last log line) or the last finished run.
 */
export function RunStatusStrip({ children }: RunStatusStripProps) {
  const { status, activeRun, lastRun, runLogs, result } = useBacktest();
  const running = status === 'running' || status === 'cancelling';
  const now = useNow(running || lastRun !== null, running ? 1_000 : 30_000);
  const summary = useRunSummary(lastRun?.request ?? null);
  const progress = activeRun?.job?.progress ?? null;
  const lastLine = runLogs.length > 0 ? runLogs[runLogs.length - 1] : null;

  let content: ReactNode;
  if (running) {
    content = (
      <>
        <StatusPill tone="run">
          {status === 'cancelling' ? 'Arrêt en cours' : 'En cours'}
          {progress !== null ? (
            <>
              {' · '}
              <span className="font-mono">{Math.round(progress)} %</span>
            </>
          ) : null}
        </StatusPill>
        <span className="shrink-0 font-mono">
          {formatElapsed(now - (activeRun?.startedAt ?? now))}
        </span>
        {lastLine ? (
          <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-fg-3">
            › {lastLine}
          </span>
        ) : null}
      </>
    );
  } else if (lastRun) {
    content = (
      <>
        <StatusPill tone="ok">
          Terminé {formatAgo(now - lastRun.finishedAt)} ·{' '}
          <span className="font-mono">
            {formatDuration(lastRun.finishedAt - lastRun.startedAt)}
          </span>
        </StatusPill>
        {summary ? <span className="min-w-0 truncate">{summary}</span> : null}
      </>
    );
  } else if (result.id) {
    content = <StatusPill tone="ok">Dernier backtest chargé</StatusPill>;
  } else {
    content = (
      <StatusPill tone="idle">
        Prêt · aucun backtest sur ce dashboard
      </StatusPill>
    );
  }

  return (
    <div className="flex min-h-[34px] items-center gap-3.5 px-[22px] pt-3 text-xs text-fg-3">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">{content}</div>
      {children ? (
        <div className="ml-auto flex shrink-0">{children}</div>
      ) : null}
    </div>
  );
}
