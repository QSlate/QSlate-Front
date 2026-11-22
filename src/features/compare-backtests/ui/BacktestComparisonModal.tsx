'use client';

import { useQuery } from '@tanstack/react-query';

import { type BacktestMetrics, parseMetrics } from '@/entities/backtest';
import { apiClient } from '@/shared/api';
import { cn } from '@/shared/lib/class-names';
import { Button, Dialog, Skeleton } from '@/shared/ui';

export interface ComparedRun {
  readonly id: string;
  /** Column title, e.g. "RsiTrend · BTC / USDT · 1 h". */
  readonly label: string;
}

interface MetricRow {
  readonly label: string;
  readonly pick: (metrics: BacktestMetrics) => number | null;
  readonly format: (value: number) => string;
  /** Which end of the scale is better. */
  readonly better: 'high' | 'low';
}

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const signed = (value: number, unit: string) =>
  `${value > 0 ? '▲ +' : value < 0 ? '▼ −' : ''}${NUMBER.format(Math.abs(value))}${unit}`;

const ROWS: readonly MetricRow[] = [
  {
    label: 'Rendement net',
    pick: (m) => m.returnPct,
    format: (v) => signed(v, ' %'),
    better: 'high',
  },
  {
    label: 'Gain net',
    pick: (m) => m.netProfitUsd,
    format: (v) => signed(v, ' USD'),
    better: 'high',
  },
  {
    label: 'Baisse maximale',
    pick: (m) =>
      m.maxDrawdownPct === null ? null : Math.abs(m.maxDrawdownPct),
    format: (v) => `${NUMBER.format(v)} %`,
    better: 'low',
  },
  {
    label: 'Ratio de Sharpe',
    pick: (m) => m.sharpe,
    format: (v) => NUMBER.format(v),
    better: 'high',
  },
  {
    label: 'Trades gagnants',
    pick: (m) => m.winRatePct,
    format: (v) => `${NUMBER.format(v)} %`,
    better: 'high',
  },
  {
    label: 'Profit factor',
    pick: (m) => m.profitFactor,
    format: (v) => NUMBER.format(v),
    better: 'high',
  },
  {
    label: 'Nombre de trades',
    pick: (m) => m.totalTrades,
    format: (v) => NUMBER.format(v),
    better: 'high',
  },
];

interface BacktestComparisonModalProps {
  readonly runs: readonly ComparedRun[];
  readonly onClose: () => void;
}

/** Side-by-side summary metrics of 2 to 4 completed runs. */
export function BacktestComparisonModal({
  runs,
  onClose,
}: BacktestComparisonModalProps) {
  const ids = runs.map((run) => run.id);
  const comparison = useQuery({
    queryKey: ['backtests', 'compare', ...ids] as const,
    queryFn: async () => {
      const response = await apiClient.compareBacktests([...ids]);
      return new Map(
        response.summaries.map((item) => [
          item.backtest_id,
          parseMetrics(item.metrics),
        ])
      );
    },
  });

  return (
    <Dialog
      title="Comparer les backtests"
      description="Le meilleur résultat de chaque ligne est marqué ★."
      onClose={onClose}
      footer={<Button onClick={onClose}>Fermer</Button>}
      className="w-[min(860px,calc(100vw-32px))]"
    >
      {comparison.isPending ? (
        <Skeleton className="h-48" />
      ) : comparison.isError ? (
        <p role="alert" className="m-0 text-xs text-loss">
          Impossible de comparer ces backtests.
        </p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <caption className="sr-only">Comparaison des métriques</caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="border-b border-line px-2.5 py-2 text-left text-[11px] font-medium text-fg-3"
                >
                  Mesure
                </th>
                {runs.map((run) => (
                  <th
                    key={run.id}
                    scope="col"
                    className="max-w-[180px] border-b border-line px-2.5 py-2 text-right text-[11px] font-medium text-fg-2"
                  >
                    {run.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const values = runs.map((run) => {
                  const metrics = comparison.data.get(run.id);
                  return metrics ? row.pick(metrics) : null;
                });
                const known = values.filter(
                  (value): value is number => value !== null
                );
                const best =
                  known.length > 1
                    ? row.better === 'high'
                      ? Math.max(...known)
                      : Math.min(...known)
                    : null;
                const tie =
                  best !== null &&
                  known.filter((value) => value === best).length > 1;
                return (
                  <tr
                    key={row.label}
                    className="border-b border-[var(--line-2)] last:border-0"
                  >
                    <th
                      scope="row"
                      className="px-2.5 py-2 text-left font-medium text-fg-2"
                    >
                      {row.label}
                    </th>
                    {values.map((value, index) => {
                      const isBest = value !== null && value === best && !tie;
                      return (
                        <td
                          key={runs[index]?.id}
                          className={cn(
                            'px-2.5 py-2 text-right font-mono tabular-nums',
                            isBest ? 'font-semibold text-fg' : 'text-fg-2'
                          )}
                        >
                          {value === null ? '—' : row.format(value)}
                          {isBest ? (
                            <span aria-label="meilleur"> ★</span>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Dialog>
  );
}
