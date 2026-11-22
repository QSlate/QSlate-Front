'use client';

import { type ReactNode, useMemo } from 'react';

import {
  type BacktestResult,
  computeMonthlyReturns,
  type EquityPoint,
} from '@/entities/backtest';

import {
  directionOf,
  formatAmount,
  formatPercent,
  formatSignedPercent,
  formatUsd,
  MONTH_LABELS,
} from '../model/format';
import { useResultView } from '../model/use-result-view';
import {
  ResultEmpty,
  ResultError,
  ResultFrame,
  ResultSkeleton,
  ResultUnavailable,
} from './result-states';
import {
  ChartDataTable,
  type SeriesPoint,
  TimeSeriesChart,
} from './time-series-chart';

const TONE = { up: 'text-gain', down: 'text-loss', flat: 'text-fg' } as const;

interface ChartFrameProps {
  readonly label: string;
  readonly render: (result: BacktestResult) => ReactNode;
}

function ChartFrame({ label, render }: ChartFrameProps) {
  const view = useResultView();
  return (
    <ResultFrame label={label} busy={view.state === 'loading'}>
      {view.state === 'loading' ? <ResultSkeleton /> : null}
      {view.state === 'empty' ? <ResultEmpty /> : null}
      {view.state === 'error' ? <ResultError /> : null}
      {view.state === 'ready' ? render(view.result) : null}
    </ResultFrame>
  );
}

/** Last point of each UTC month (rows of the hidden data tables). */
function monthEnds(equity: readonly EquityPoint[]): EquityPoint[] {
  const ends = new Map<string, EquityPoint>();
  for (const point of equity) {
    const date = new Date(point.time * 1_000);
    ends.set(`${date.getUTCFullYear()}-${date.getUTCMonth()}`, point);
  }
  return [...ends.values()];
}

function monthName(seconds: number): string {
  const date = new Date(seconds * 1_000);
  return `${MONTH_LABELS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function CapitalChart({ result }: { readonly result: BacktestResult }) {
  const { equity, trades } = result;
  const start = equity[0]?.equity ?? null;
  const points = useMemo<SeriesPoint[]>(
    () => equity.map((point) => ({ time: point.time, value: point.equity })),
    [equity]
  );
  const markers = useMemo(
    () => trades.map((trade) => trade.entryTime),
    [trades]
  );
  if (equity.length < 2) {
    return (
      <ResultUnavailable description="La courbe de capital de ce backtest est vide." />
    );
  }
  return (
    <div className="flex h-full flex-col gap-2">
      <div
        className="flex items-center gap-3 text-[11.5px] text-fg-3"
        aria-hidden="true"
      >
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-[3px] w-3 rounded-sm bg-[linear-gradient(90deg,var(--a1),var(--a2))]" />
          Stratégie
        </span>
        {markers.length > 0 ? (
          <span className="flex items-center gap-1.5">
            <i className="inline-block size-[7px] rounded-full bg-gain" />
            Entrées
          </span>
        ) : null}
      </div>
      <div className="min-h-0 flex-1">
        <TimeSeriesChart
          label="Évolution du capital"
          points={points}
          tone="brand"
          fill="below"
          markers={markers}
          formatAxis={formatAmount}
          tooltip={(point) => {
            const change = start ? ((point.value - start) / start) * 100 : null;
            return [
              { label: 'Capital', value: formatUsd(point.value) },
              ...(change !== null
                ? [
                    {
                      label: 'Depuis le départ',
                      value: formatSignedPercent(change, 2),
                      className: TONE[directionOf(change)],
                    },
                  ]
                : []),
            ];
          }}
        />
      </div>
      <ChartDataTable
        caption="Capital en fin de mois"
        headers={['Mois', 'Capital (USD)']}
        rows={monthEnds(equity).map((point) => [
          monthName(point.time),
          formatAmount(point.equity),
        ])}
      />
    </div>
  );
}

/** "Capital": equity curve with trade entries. */
export function CapitalChartWidget() {
  return (
    <ChartFrame
      label="Évolution du capital"
      render={(result) => <CapitalChart result={result} />}
    />
  );
}

function DrawdownChart({ result }: { readonly result: BacktestResult }) {
  const points = useMemo<SeriesPoint[]>(
    () =>
      result.equity.map((point) => ({
        time: point.time,
        value: point.drawdownPct,
      })),
    [result.equity]
  );
  if (points.length < 2) {
    return (
      <ResultUnavailable description="La courbe de capital de ce backtest est vide." />
    );
  }
  if (points.every((point) => point.value === 0)) {
    return (
      <ResultUnavailable description="Le capital n'a jamais baissé sous son précédent sommet." />
    );
  }
  return (
    <>
      <TimeSeriesChart
        label="Baisses du capital depuis le précédent sommet"
        points={points}
        tone="loss"
        fill="above"
        formatAxis={(value) => `${value.toFixed(0)} %`}
        tooltip={(point) => [
          {
            label: 'Sous le sommet',
            value:
              point.value === 0 ? '0,0 %' : formatSignedPercent(point.value),
            className: point.value < 0 ? 'text-loss' : undefined,
          },
        ]}
      />
      <ChartDataTable
        caption="Pire baisse de chaque mois"
        headers={['Mois', 'Baisse (%)']}
        rows={Object.entries(
          result.equity.reduce<Record<string, number>>((worst, point) => {
            const key = monthName(point.time);
            worst[key] = Math.min(worst[key] ?? 0, point.drawdownPct);
            return worst;
          }, {})
        ).map(([month, value]) => [month, formatPercent(value)])}
      />
    </>
  );
}

/** "Baisses dans le temps": drawdown from the running peak. */
export function DrawdownChartWidget() {
  return (
    <ChartFrame
      label="Baisses dans le temps"
      render={(result) => <DrawdownChart result={result} />}
    />
  );
}

function heatColor(value: number, maxAbs: number): string {
  const strength = Math.round(12 + Math.min(1, Math.abs(value) / maxAbs) * 58);
  const token = value >= 0 ? 'var(--gain)' : 'var(--loss)';
  return `color-mix(in srgb, ${token} ${strength}%, var(--sunken))`;
}

function MonthlyHeatmap({ result }: { readonly result: BacktestResult }) {
  const months = useMemo(
    () => computeMonthlyReturns(result.equity),
    [result.equity]
  );
  if (months.length === 0) {
    return (
      <ResultUnavailable description="La courbe de capital est trop courte pour un mois complet." />
    );
  }
  const years = [...new Set(months.map((month) => month.year))];
  const maxAbs = Math.max(
    0.5,
    ...months.map((month) => Math.abs(month.returnPct))
  );
  const byKey = new Map(
    months.map((month) => [`${month.year}-${month.month}`, month])
  );
  return (
    <table className="h-full w-full table-fixed border-separate border-spacing-1 font-mono text-[10px] text-fg-3">
      <caption className="sr-only">
        Rendement de chaque mois, en pourcentage
      </caption>
      <thead>
        <tr>
          <th scope="col" className="w-[38px]">
            <span className="sr-only">Année</span>
          </th>
          {MONTH_LABELS.map((label) => (
            <th key={label} scope="col" className="text-center font-medium">
              {label.slice(0, 3)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {years.map((year) => (
          <tr key={year}>
            <th scope="row" className="text-left font-medium text-fg-2">
              {year}
            </th>
            {MONTH_LABELS.map((label, month) => {
              const cell = byKey.get(`${year}-${month}`);
              return (
                <td
                  key={label}
                  className="h-[26px] rounded-md text-center text-[9.5px] text-fg"
                  // The cell color encodes the return: a computed mix.
                  style={
                    cell
                      ? { background: heatColor(cell.returnPct, maxAbs) }
                      : undefined
                  }
                  title={
                    cell
                      ? `${label} ${year} : ${formatSignedPercent(cell.returnPct)}`
                      : undefined
                  }
                >
                  {cell ? (
                    <>
                      <span aria-hidden="true">
                        {cell.returnPct > 0
                          ? '+'
                          : cell.returnPct < 0
                            ? '−'
                            : ''}
                        {Math.abs(cell.returnPct).toFixed(1)}
                      </span>
                      <span className="sr-only">
                        {formatSignedPercent(cell.returnPct)}
                      </span>
                    </>
                  ) : (
                    <span className="sr-only">Pas de données</span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** "Rendements mensuels" heatmap computed from the equity curve. */
export function MonthlyReturnsWidget() {
  return (
    <ChartFrame
      label="Rendements mensuels"
      render={(result) => <MonthlyHeatmap result={result} />}
    />
  );
}
