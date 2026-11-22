'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { GitCompare, History, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { backtestKeys, useLoadedBacktestStore } from '@/entities/backtest';
import { formatDatasetLabel, useRunDatasets } from '@/entities/dataset';
import { useStrategies } from '@/entities/strategy';
import {
  BacktestComparisonModal,
  type ComparedRun,
} from '@/features/compare-backtests';
import { useLabStore } from '@/features/lab-state';
import { apiClient, type BacktestJob } from '@/shared/api';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';
import {
  Badge,
  type BadgeTone,
  Button,
  Dialog,
  EmptyState,
  IconButton,
  Skeleton,
} from '@/shared/ui';

const PAGE_SIZE = 25;
const FIRST_PAGE: string | undefined = undefined;
const MAX_COMPARED = 4;
const DATE = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const AMOUNT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

const STATUS: Readonly<
  Record<
    BacktestJob['status'],
    { readonly label: string; readonly tone: BadgeTone }
  >
> = {
  queued: { label: 'En attente', tone: 'neutral' },
  pending: { label: 'En attente', tone: 'neutral' },
  running: { label: 'En cours', tone: 'brand' },
  completed: { label: 'Terminé', tone: 'gain' },
  failed: { label: 'Échec', tone: 'loss' },
  cancelled: { label: 'Annulé', tone: 'warn' },
};

function isTerminal(status: BacktestJob['status']): boolean {
  return (
    status === 'completed' || status === 'failed' || status === 'cancelled'
  );
}

/** "Historique": every run with status, open, compare and delete. */
export function BacktestRunsView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setLoaded = useLoadedBacktestStore(
    (state) => state.setLoadedBacktestId
  );
  const showToast = useLabStore((state) => state.showToast);
  const strategies = useStrategies();
  const datasets = useRunDatasets();
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [deleting, setDeleting] = useState<BacktestJob | null>(null);
  const [pending, setPending] = useState(false);

  const runs = useInfiniteQuery({
    queryKey: [...backtestKeys.list(), 'history'] as const,
    initialPageParam: FIRST_PAGE,
    queryFn: ({ pageParam }) =>
      apiClient.getBacktests({
        limit: PAGE_SIZE,
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    getNextPageParam: (page) => page.next_cursor || undefined,
  });
  const items = runs.data?.pages.flatMap((page) => page.items ?? []) ?? [];

  const label = (run: BacktestJob) => {
    const strategy = strategies.data?.find(
      (item) => item.id === run.input.strategy_id
    )?.name;
    const dataset = datasets.data?.find(
      (item) => item.id === run.input.dataset_id
    );
    return [
      strategy ?? 'Stratégie supprimée',
      dataset ? formatDatasetLabel(dataset) : run.input.dataset_id,
    ].join(' · ');
  };

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < MAX_COMPARED
          ? [...current, id]
          : current
    );

  const open = (run: BacktestJob) => {
    setLoaded(run.backtest_id);
    router.push('/lab');
  };

  const remove = async (run: BacktestJob) => {
    setPending(true);
    try {
      await apiClient.deleteBacktest(run.backtest_id);
      setSelected((current) => current.filter((id) => id !== run.backtest_id));
      await queryClient.invalidateQueries({ queryKey: backtestKeys.list() });
      showToast('Backtest supprimé', 'success');
      setDeleting(null);
    } catch {
      showToast('Impossible de supprimer ce backtest.', 'error');
    } finally {
      setPending(false);
    }
  };

  const compared: readonly ComparedRun[] = selected.flatMap((id) => {
    const run = items.find((item) => item.backtest_id === id);
    return run ? [{ id, label: label(run) }] : [];
  });

  return (
    <section
      aria-label="Historique des backtests"
      className="flex flex-col gap-3 px-[22px] py-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-[12.5px] text-fg-3">
          Coche jusqu&apos;à {MAX_COMPARED} backtests terminés pour les
          comparer.
        </p>
        <Button
          leadingIcon={<GitCompare size={15} />}
          disabled={selected.length < 2}
          onClick={() => setComparing(true)}
        >
          Comparer{selected.length > 0 ? ` (${selected.length})` : ''}
        </Button>
      </div>
      {runs.isPending ? (
        <Skeleton className="h-40" />
      ) : runs.isError ? (
        <p role="alert" className="m-0 text-xs text-loss">
          Impossible de charger l&apos;historique.
        </p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<History />}
          title="Aucun backtest pour le moment"
          description="Tes backtests apparaîtront ici, avec leurs réglages et leur statut."
        />
      ) : (
        <div className="overflow-auto rounded-xl border border-line bg-surface shadow-card">
          <table className="w-full border-collapse text-[12.5px]">
            <caption className="sr-only">Backtests</caption>
            <thead>
              <tr className="text-left text-[11px] text-fg-3">
                <th scope="col" className="w-10 border-b border-line px-3 py-2">
                  <span className="sr-only">Comparer</span>
                </th>
                {[
                  'Lancé le',
                  'Stratégie · données',
                  'Capital',
                  'Statut',
                  '',
                ].map((header) => (
                  <th
                    key={header || 'actions'}
                    scope="col"
                    className="border-b border-line px-3 py-2 font-medium"
                  >
                    {header || <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((run) => {
                const status = STATUS[run.status];
                const capital = Number(run.input.initial_capital);
                const completed = run.status === 'completed';
                return (
                  <tr
                    key={run.backtest_id}
                    className="border-b border-[var(--line-2)] last:border-0"
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label={`Comparer ${label(run)}`}
                        disabled={
                          !completed ||
                          (!selected.includes(run.backtest_id) &&
                            selected.length >= MAX_COMPARED)
                        }
                        checked={selected.includes(run.backtest_id)}
                        onChange={() => toggle(run.backtest_id)}
                        className={cn(FOCUS_RING, 'size-4 accent-[var(--a1)]')}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-fg-2">
                      {DATE.format(new Date(run.created_at))}
                    </td>
                    <td className="px-3 py-2 text-fg">
                      {label(run)}
                      {run.status === 'failed' && run.error ? (
                        <span
                          className="mt-0.5 block max-w-[420px] truncate text-[11px] text-loss"
                          title={run.error}
                        >
                          {run.error}
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-fg-2">
                      {Number.isFinite(capital)
                        ? `${AMOUNT.format(capital)} USD`
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        tone={status.tone}
                        dot
                        pulse={run.status === 'running'}
                      >
                        {status.label}
                        {run.status === 'running' ? (
                          <span className="font-mono"> · {run.progress} %</span>
                        ) : null}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      {completed ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => open(run)}
                        >
                          Ouvrir
                        </Button>
                      ) : null}
                      {isTerminal(run.status) ? (
                        <IconButton
                          icon={<Trash2 size={14} />}
                          label="Supprimer ce backtest"
                          size="sm"
                          className="ml-1"
                          onClick={() => setDeleting(run)}
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {runs.hasNextPage ? (
        <Button
          variant="quiet"
          className="self-center"
          disabled={runs.isFetchingNextPage}
          onClick={() => void runs.fetchNextPage()}
        >
          {runs.isFetchingNextPage ? 'Chargement…' : 'Afficher plus'}
        </Button>
      ) : null}
      {comparing ? (
        <BacktestComparisonModal
          runs={compared}
          onClose={() => setComparing(false)}
        />
      ) : null}
      {deleting ? (
        <Dialog
          title="Supprimer ce backtest ?"
          description="Ses résultats, trades et logs seront supprimés définitivement."
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button variant="quiet" onClick={() => setDeleting(null)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                disabled={pending}
                onClick={() => void remove(deleting)}
              >
                {pending ? 'Suppression…' : 'Supprimer'}
              </Button>
            </>
          }
        >
          {null}
        </Dialog>
      ) : null}
    </section>
  );
}
