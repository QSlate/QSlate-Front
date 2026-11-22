'use client';

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { type KeyboardEvent, type ReactNode, useMemo, useState } from 'react';

import {
  type BacktestResult,
  computeReturnHistogram,
  type Trade,
} from '@/entities/backtest';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';
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

/** Axis label of a bin edge: "−6 %", "0", "+8 %". */
function edgeLabel(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return '0';
  const body = `${ONE_DECIMAL.format(Math.abs(rounded)).replace(/,0$/u, '')} %`;
  return rounded > 0 ? `+${body}` : `−${body}`;
}

function tradesLabel(count: number): string {
  return `${count} trade${count > 1 ? 's' : ''}`;
}

/** Bin edges to label on the x-axis: both ends, zero, and evenly spaced ones. */
function labelledEdges(binCount: number, zeroIndex: number): number[] {
  const step = Math.max(1, Math.ceil(binCount / 4));
  const edges = new Set([zeroIndex]);
  // Zero always shows; other edges only when they do not crowd it.
  for (let edge = 0; edge <= binCount; edge += step) {
    if (Math.abs(edge - zeroIndex) >= step / 2) edges.add(edge);
  }
  if (Math.abs(binCount - zeroIndex) >= step / 2) edges.add(binCount);
  return [...edges]
    .filter((edge) => edge >= 0 && edge <= binCount)
    .sort((left, right) => left - right);
}

function Histogram({ trades }: { readonly trades: readonly Trade[] }) {
  const [active, setActive] = useState<number | null>(null);
  const returns = useMemo(
    () =>
      trades.flatMap((trade) => (trade.pnlPct === null ? [] : [trade.pnlPct])),
    [trades]
  );
  const bins = useMemo(() => computeReturnHistogram(returns), [returns]);
  const first = bins[0];
  if (!first) {
    return (
      <ResultUnavailable description="Le moteur n'a pas fourni le rendement des trades." />
    );
  }
  const width = first.to - first.from;
  const peak = Math.max(1, ...bins.map((bin) => bin.count));
  const countTicks = [...new Set([peak, Math.round(peak / 2), 0])];
  const zeroIndex = Math.round(-first.from / width);
  const edgeValue = (edge: number) => first.from + edge * width;
  const activeBin = active === null ? null : (bins[active] ?? null);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const delta = event.key === 'ArrowLeft' ? -1 : 1;
    setActive((current) =>
      Math.min(bins.length - 1, Math.max(0, (current ?? -delta) + delta))
    );
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-[auto_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] gap-x-2 gap-y-1">
      <div
        aria-hidden="true"
        className="flex flex-col justify-between font-mono text-[10.5px] leading-none text-fg-3"
      >
        {countTicks.map((tick) => (
          <span key={tick} className="text-right">
            {tick}
          </span>
        ))}
      </div>
      <div
        role="img"
        aria-label="Histogramme des trades par tranche de rendement (flèches gauche et droite pour parcourir)"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
        className={cn(
          'relative flex min-h-0 items-end gap-[3px] rounded-sm border-b border-line',
          FOCUS_RING
        )}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 border-l border-dashed border-fg-3/60"
          // Zero line: a computed position along the bins.
          style={{ left: `${(zeroIndex / bins.length) * 100}%` }}
        />
        {bins.map((bin, index) => (
          <div
            key={bin.from}
            aria-hidden="true"
            onPointerEnter={() => setActive(index)}
            className="flex h-full flex-1 items-end"
          >
            <div
              className={cn(
                'w-full rounded-t-[4px] transition-opacity',
                bin.to <= 0 ? 'bg-loss' : 'bg-gain',
                active === null || active === index
                  ? 'opacity-75'
                  : 'opacity-35'
              )}
              // Bar height is proportional to the bin count.
              style={{
                height: `${Math.max(bin.count > 0 ? 3 : 0, (bin.count / peak) * 100)}%`,
              }}
            />
          </div>
        ))}
        {activeBin && active !== null ? (
          <div
            role="status"
            className="pointer-events-none absolute top-1 z-[3] whitespace-nowrap rounded-[11px] border border-line-strong bg-[color-mix(in_srgb,var(--raised)_88%,transparent)] px-[11px] py-[7px] text-[11.5px] shadow-[var(--shadow-2)] backdrop-blur-[10px]"
            // Follows the hovered bar: a computed position.
            style={
              active < bins.length / 2
                ? { left: `${((active + 1) / bins.length) * 100}%` }
                : { right: `${(1 - active / bins.length) * 100}%` }
            }
          >
            <div className="font-mono text-[10.5px] text-fg-3">
              {edgeLabel(activeBin.from)} → {edgeLabel(activeBin.to)}
            </div>
            <b className="font-mono font-semibold text-fg">
              {tradesLabel(activeBin.count)}
            </b>
          </div>
        ) : null}
      </div>
      <span aria-hidden="true" />
      <div
        aria-hidden="true"
        className="relative h-3.5 font-mono text-[10.5px] leading-none text-fg-3"
      >
        {labelledEdges(bins.length, zeroIndex).map((edge) => (
          <span
            key={edge}
            className={cn(
              'absolute top-0 whitespace-nowrap',
              edge === 0
                ? 'left-0'
                : edge === bins.length
                  ? 'right-0'
                  : '-translate-x-1/2'
            )}
            // Bin edge position along the axis.
            style={
              edge === 0 || edge === bins.length
                ? undefined
                : { left: `${(edge / bins.length) * 100}%` }
            }
          >
            {edgeLabel(edgeValue(edge))}
          </span>
        ))}
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
