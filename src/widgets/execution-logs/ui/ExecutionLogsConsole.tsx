'use client';

import { ArrowDown, Check, Copy, Download, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useBacktestLogs, useLoadedBacktestStore } from '@/entities/backtest';
import { useLabStore } from '@/features/lab-state';
import { useBacktest } from '@/features/run-backtest';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';
import { IconButton, SegmentedControl, Skeleton } from '@/shared/ui';

export type LogLevel = 'ALL' | 'INFO' | 'WARN' | 'ERROR';

export interface ParsedLogLine {
  readonly id: string;
  readonly level: 'INFO' | 'WARN' | 'ERROR' | 'STDOUT';
  readonly message: string;
}

const NO_LINES: readonly string[] = [];

const LEVEL_OPTIONS = [
  { value: 'ALL', label: 'Tout' },
  { value: 'INFO', label: 'Info' },
  { value: 'WARN', label: 'Alertes' },
  { value: 'ERROR', label: 'Erreurs' },
] as const;

/** Classifies an engine log line by its usual markers. */
export function parseLogLine(line: string, index: number): ParsedLogLine {
  const upper = line.toUpperCase();
  let level: ParsedLogLine['level'] = 'STDOUT';
  if (/\bERROR\b|TRACEBACK|EXCEPTION/.test(upper)) level = 'ERROR';
  else if (/\bWARN(ING)?\b/.test(upper)) level = 'WARN';
  else if (/\bINFO\b/.test(upper)) level = 'INFO';
  return { id: `log-${index}`, level, message: line };
}

function isLogLevel(value: string): value is LogLevel {
  return LEVEL_OPTIONS.some((option) => option.value === value);
}

/**
 * Bottom console with the logs of the current run: streamed lines while a
 * run is live (or just finished), the REST history of the loaded backtest
 * otherwise. Nothing is shown when no backtest exists.
 */
export function ExecutionLogsConsole() {
  const showToast = useLabStore((state) => state.showToast);
  const isOpen = useLabStore((state) => state.isExecutionLogsOpen);
  const setIsOpen = useLabStore((state) => state.setExecutionLogsOpen);
  const loadedBacktestId = useLoadedBacktestStore(
    (state) => state.loadedBacktestId
  );
  const { status, activeRun, lastRun, runLogs } = useBacktest();

  const running = status === 'running' || status === 'cancelling';
  const streamedFor = running
    ? (activeRun?.backtestId ?? null)
    : (lastRun?.backtestId ?? null);
  const useStream =
    running || (runLogs.length > 0 && streamedFor === loadedBacktestId);
  const history = useBacktestLogs(loadedBacktestId, isOpen && !useStream);
  const lines: readonly string[] = useMemo(
    () => (useStream ? runLogs : (history.data ?? NO_LINES)),
    [useStream, runLogs, history.data]
  );
  const backtestId = useStream ? streamedFor : loadedBacktestId;

  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<LogLevel>('ALL');
  const [autoscroll, setAutoscroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return lines
      .map(parseLogLine)
      .filter(
        (line) =>
          (level === 'ALL' || line.level === level) &&
          (needle === '' || line.message.toLowerCase().includes(needle))
      );
  }, [lines, level, query]);

  useEffect(() => {
    const list = listRef.current;
    if (autoscroll && list) list.scrollTop = list.scrollHeight;
  }, [visible, autoscroll]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2_500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!isOpen) return null;

  const text = visible.map((line) => line.message).join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Logs copiés dans le presse-papiers', 'success');
    } catch {
      showToast('Impossible de copier les logs', 'warning');
    }
  };

  const download = () => {
    const url = URL.createObjectURL(
      new Blob([text], { type: 'text/plain;charset=utf-8' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `qslate-${backtestId ?? 'logs'}.log`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const onScroll = () => {
    const list = listRef.current;
    if (!list) return;
    const atBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight < 40;
    if (atBottom !== autoscroll) setAutoscroll(atBottom);
  };

  let body;
  if (!backtestId) {
    body = (
      <p className="p-4 text-fg-3">
        Aucun backtest chargé. Lance un backtest pour voir ses logs ici.
      </p>
    );
  } else if (!useStream && history.isPending) {
    body = (
      <div className="space-y-2 p-4">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    );
  } else if (!useStream && history.isError) {
    body = (
      <p className="p-4 text-loss">Impossible de charger les logs de ce run.</p>
    );
  } else if (lines.length === 0) {
    body = (
      <p className="p-4 text-fg-3">
        {running
          ? 'Le moteur publie ses logs à la fin du run.'
          : "Ce run n'a produit aucun log."}
      </p>
    );
  } else if (visible.length === 0) {
    body = <p className="p-4 text-fg-3">Aucune ligne ne correspond.</p>;
  } else {
    body = (
      <ol className="m-0 list-none p-0">
        {visible.map((line, index) => (
          <li
            key={line.id}
            className="flex gap-3 px-4 py-0.5 hover:bg-[var(--line-2)]"
          >
            <span className="w-10 shrink-0 select-none text-right text-fg-3">
              {index + 1}
            </span>
            <span
              className={cn(
                'whitespace-pre-wrap break-all',
                line.level === 'ERROR' && 'text-loss',
                line.level === 'WARN' && 'text-warn',
                line.level !== 'ERROR' && line.level !== 'WARN' && 'text-fg-2'
              )}
            >
              {line.message}
            </span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <section
      aria-label="Logs d'exécution"
      className="fixed inset-x-0 bottom-0 z-40 flex h-80 flex-col border-t border-line bg-surface font-mono text-xs text-fg shadow-[var(--shadow-2)] sm:h-96"
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2 font-sans">
        <h2 className="m-0 text-[13px] font-semibold">Logs d&apos;exécution</h2>
        {backtestId ? (
          <span className="font-mono text-[11px] text-fg-3">
            {backtestId.slice(0, 10)}…
          </span>
        ) : null}
        <span className="flex-1" />
        <label className="relative flex items-center">
          <span className="sr-only">Rechercher dans les logs</span>
          <Search
            size={13}
            aria-hidden="true"
            className="pointer-events-none absolute left-2 text-fg-3"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher…"
            className={cn(
              'h-8 w-44 rounded-lg border border-line bg-sunken pl-7 pr-2 font-mono text-xs text-fg placeholder:text-fg-3',
              FOCUS_RING
            )}
          />
        </label>
        <SegmentedControl
          label="Niveau des logs"
          size="sm"
          options={LEVEL_OPTIONS}
          value={level}
          onValueChange={(next) => {
            if (isLogLevel(next)) setLevel(next);
          }}
        />
        <IconButton
          icon={<ArrowDown size={14} />}
          label="Défilement automatique"
          aria-pressed={autoscroll}
          onClick={() => setAutoscroll((value) => !value)}
        />
        <IconButton
          icon={copied ? <Check size={14} /> : <Copy size={14} />}
          label="Copier les logs"
          disabled={visible.length === 0}
          onClick={() => void copy()}
        />
        <IconButton
          icon={<Download size={14} />}
          label="Télécharger les logs"
          disabled={visible.length === 0}
          onClick={download}
        />
        <IconButton
          icon={<X size={14} />}
          label="Fermer les logs"
          onClick={() => setIsOpen(false)}
        />
      </header>
      <div
        ref={listRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto py-2"
      >
        {body}
      </div>
    </section>
  );
}
