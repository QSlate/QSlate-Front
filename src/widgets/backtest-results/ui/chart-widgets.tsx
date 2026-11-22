'use client';

import { Fragment, type ReactNode, useMemo } from 'react';

import {
  type BacktestResult,
  computeMonthlyReturns,
  type EquityPoint,
} from '@/entities/backtest';

import {
  directionOf,
  formatAmount,
  formatDecimal,
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

function formatAxisAmount(value: number, decimals: number): string {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatAxisPercent(value: number, decimals: number): string {
  return `${formatAxisAmount(value, decimals)} %`;
}

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
          formatAxis={formatAxisAmount}
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
        formatAxis={formatAxisPercent}
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

function signOf(value: number): string {
  if (value > 0) return '+';
  if (value < 0) return '−';
  return '';
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
    <>
      {/* Compact grid (year rows × 12 months) like the mockup; the cells
          keep a fixed height whatever the widget size, and the widget
          scrolls when many years do not fit. Screen readers get the table. */}
      <div className="@container h-full min-h-0 overflow-y-auto">
        <div
          aria-hidden="true"
          className="grid min-h-full grid-cols-[34px_repeat(12,minmax(0,1fr))] content-center items-center gap-1 font-mono text-[10px] font-medium text-fg-3"
        >
          <span />
          {MONTH_LABELS.map((label) => (
            <span key={label} className="truncate text-center">
              <span className="@[460px]:hidden">{label.charAt(0)}</span>
              <span className="hidden @[460px]:inline">
                {label.replace('.', '')}
              </span>
            </span>
          ))}
          {years.map((year) => (
            <Fragment key={year}>
              <span className="text-fg-2">{year}</span>
              {MONTH_LABELS.map((label, month) => {
                const cell = byKey.get(`${year}-${month}`);
                return (
                  <span
                    key={label}
                    title={
                      cell
                        ? `${label} ${year} : ${formatSignedPercent(cell.returnPct)}`
                        : `${label} ${year} : pas de données`
                    }
                    className="grid h-[26px] min-w-0 place-items-center overflow-hidden rounded-md bg-sunken text-[9.5px] text-fg"
                    // The cell color encodes the return: a computed mix.
                    style={
                      cell
                        ? { background: heatColor(cell.returnPct, maxAbs) }
                        : undefined
                    }
                  >
                    {cell ? (
                      <span>
                        {signOf(cell.returnPct)}
                        {/* Narrow widgets keep the sign (never color alone). */}
                        <span className="hidden @[380px]:inline">
                          {formatDecimal(Math.abs(cell.returnPct))}
                        </span>
                      </span>
                    ) : null}
                  </span>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
      <ChartDataTable
        caption="Rendement de chaque mois, en pourcentage"
        headers={['Mois', 'Rendement (%)']}
        rows={months.map((month) => [
          `${MONTH_LABELS[month.month]} ${month.year}`,
          formatSignedPercent(month.returnPct),
        ])}
      />
    </>
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
