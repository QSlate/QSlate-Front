'use client';

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';

import {
  type BacktestResult,
  computeReturnHistogram,
  type Trade,
} from '@/entities/backtest';
import { cn } from '@/shared/lib/class-names';
import { Button, SegmentedControl } from '@/shared/ui';

import {
  formatDayTime,
  formatPrice,
  formatSignedPercent,
  formatSignedUsd,
} from '../model/format';
import { useResultView } from '../model/use-result-view';
import {
  ResultEmpty,
  ResultError,
  ResultFrame,
  ResultSkeleton,
  ResultUnavailable,
} from './result-states';
import { ChartDataTable } from './time-series-chart';

interface TradeFrameProps {
  readonly label: string;
  readonly render: (result: BacktestResult) => ReactNode;
}

function TradeFrame({ label, render }: TradeFrameProps) {
  const view = useResultView();
  return (
    <ResultFrame label={label} busy={view.state === 'loading'}>
      {view.state === 'loading' ? <ResultSkeleton /> : null}
      {view.state === 'empty' ? <ResultEmpty /> : null}
      {view.state === 'error' ? <ResultError /> : null}
      {view.state === 'ready' ? (
        view.result.trades.length === 0 ? (
          <ResultUnavailable description="Aucun trade n'a été ouvert sur la période." />
        ) : (
          render(view.result)
        )
      ) : null}
    </ResultFrame>
  );
}

const ONE_DECIMAL = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function binLabel(from: number, to: number): string {
  return `${ONE_DECIMAL.format(from)} à ${ONE_DECIMAL.format(to)} %`;
}

function Histogram({ trades }: { readonly trades: readonly Trade[] }) {
  const returns = useMemo(
    () =>
      trades.flatMap((trade) => (trade.pnlPct === null ? [] : [trade.pnlPct])),
    [trades]
  );
  const bins = useMemo(() => computeReturnHistogram(returns), [returns]);
  if (bins.length === 0) {
    return (
      <ResultUnavailable description="Le moteur n'a pas fourni le rendement des trades." />
    );
  }
  const peak = Math.max(...bins.map((bin) => bin.count));
  return (
    <div className="flex h-full flex-col gap-1.5">
      <div
        aria-hidden="true"
        className="flex min-h-0 flex-1 items-end gap-[3px] border-b border-line"
      >
        {bins.map((bin) => {
          const negative = bin.to <= 0;
          return (
            <div
              key={bin.from}
              title={`${binLabel(bin.from, bin.to)} : ${bin.count} trade${bin.count > 1 ? 's' : ''}`}
              className={cn(
                'relative flex-1 rounded-t-[4px]',
                negative ? 'bg-loss/70' : 'bg-gain/70'
              )}
              // Bar height is proportional to the bin count.
              style={{
                height: `${Math.max(bin.count > 0 ? 3 : 0, (bin.count / peak) * 100)}%`,
              }}
            />
          );
        })}
      </div>
      <div
        aria-hidden="true"
        className="flex justify-between font-mono text-[10.5px] text-fg-3"
      >
        <span>{formatSignedPercent(bins[0]?.from ?? 0)}</span>
        <span>0 %</span>
        <span>{formatSignedPercent(bins[bins.length - 1]?.to ?? 0)}</span>
      </div>
      <ChartDataTable
        caption="Nombre de trades par tranche de rendement"
        headers={['Rendement', 'Trades']}
        rows={bins.map((bin) => [binLabel(bin.from, bin.to), bin.count])}
      />
    </div>
  );
}

/** "Répartition des trades": histogram of trade returns (pnl_pct). */
export function TradeDistributionWidget() {
  return (
    <TradeFrame
      label="Répartition des trades"
      render={(result) => <Histogram trades={result.trades} />}
    />
  );
}

type TradeFilter = 'all' | 'win' | 'loss';

const FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'win', label: 'Gagnants' },
  { value: 'loss', label: 'Perdants' },
] as const;

const PAGE_SIZE = 50;

function isTradeFilter(value: string): value is TradeFilter {
  return FILTERS.some((filter) => filter.value === value);
}

function TradesTable({ trades }: { readonly trades: readonly Trade[] }) {
  const [filter, setFilter] = useState<TradeFilter>('all');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const rows = useMemo(
    () =>
      trades.filter((trade) => {
        if (filter === 'all') return true;
        const pnl = trade.pnlUsd ?? trade.pnlPct;
        return pnl !== null && (filter === 'win' ? pnl > 0 : pnl < 0);
      }),
    [filter, trades]
  );
  const shown = rows.slice(0, visible);
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <SegmentedControl
          label="Filtrer les trades"
          size="sm"
          options={FILTERS}
          value={filter}
          onValueChange={(next) => {
            if (!isTradeFilter(next)) return;
            setFilter(next);
            setVisible(PAGE_SIZE);
          }}
        />
        <span className="font-mono text-[11px] text-fg-3">
          {shown.length} / {rows.length}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <caption className="sr-only">Journal des trades</caption>
          <thead className="sticky top-0 bg-surface">
            <tr className="text-left text-[11px] text-fg-3">
              {[
                'Entrée',
                'Sens',
                'Prix entrée',
                'Prix sortie',
                'Sortie',
                'Résultat',
              ].map((header, index) => (
                <th
                  key={header}
                  scope="col"
                  className={cn(
                    'whitespace-nowrap border-b border-line px-2.5 py-[7px] font-medium',
                    index >= 2 && index !== 4 && 'text-right'
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((trade) => {
              const pnl = trade.pnlPct ?? null;
              return (
                <tr
                  key={trade.id}
                  className="border-b border-[var(--line-2)] last:border-0"
                >
                  <td className="whitespace-nowrap px-2.5 py-2 font-mono text-fg-2">
                    {formatDayTime(trade.entryTime)}
                  </td>
                  <td className="px-2.5 py-2">
                    <span
                      className={cn(
                        'inline-flex h-5 items-center gap-1 rounded-md px-[7px] text-[10.5px] font-semibold',
                        trade.side === 'long'
                          ? 'bg-brand-soft text-brand'
                          : 'bg-vio-soft text-vio'
                      )}
                    >
                      {trade.side === 'long' ? (
                        <ArrowUpRight size={11} aria-hidden="true" />
                      ) : (
                        <ArrowDownRight size={11} aria-hidden="true" />
                      )}
                      {trade.side === 'long' ? 'Achat' : 'Vente'}
                    </span>
                  </td>
                  <td className="px-2.5 py-2 text-right font-mono tabular-nums">
                    {trade.entryPrice === null
                      ? '—'
                      : formatPrice(trade.entryPrice)}
                  </td>
                  <td className="px-2.5 py-2 text-right font-mono tabular-nums">
                    {trade.exitPrice === null
                      ? '—'
                      : formatPrice(trade.exitPrice)}
                  </td>
                  <td className="max-w-[140px] truncate px-2.5 py-2 text-fg-3">
                    {trade.exitReason ?? '—'}
                  </td>
                  <td className="px-2.5 py-2 text-right">
                    {pnl === null ? (
                      '—'
                    ) : (
                      <span
                        className={cn(
                          'inline-flex h-[22px] items-center rounded-[7px] px-[7px] font-mono text-[11.5px] font-semibold',
                          pnl > 0 && 'bg-gain-soft text-gain',
                          pnl < 0 && 'bg-loss-soft text-loss',
                          pnl === 0 && 'text-fg-2'
                        )}
                        title={
                          trade.pnlUsd === null
                            ? undefined
                            : formatSignedUsd(trade.pnlUsd)
                        }
                      >
                        {formatSignedPercent(pnl, 2)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="m-0 p-4 text-center text-[11.5px] text-fg-3">
            Aucun trade dans cette catégorie.
          </p>
        ) : null}
        {shown.length < rows.length ? (
          <div className="flex justify-center p-2">
            <Button
              size="sm"
              variant="quiet"
              onClick={() => setVisible((count) => count + PAGE_SIZE)}
            >
              Afficher {Math.min(PAGE_SIZE, rows.length - shown.length)} de plus
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** "Trades": journal with Tous/Gagnants/Perdants and incremental paging. */
export function TradesTableWidget() {
  return (
    <TradeFrame
      label="Trades"
      render={(result) => <TradesTable trades={result.trades} />}
    />
  );
}
