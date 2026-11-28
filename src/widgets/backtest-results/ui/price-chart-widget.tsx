'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';

import type { BacktestResult } from '@/entities/backtest';
import {
  type Candle,
  formatDatasetLabel,
  type RunDataset,
  useDatasetCandles,
} from '@/entities/dataset';
import { SegmentedControl } from '@/shared/ui';

import { formatAmount, formatPrice, MONTH_LABELS } from '../model/format';
import { tradeMarkers } from '../model/price-markers';
import { runRange, useRunDataset } from '../model/run-dataset';
import { useResultView } from '../model/use-result-view';
import { OhlcLegend } from './ohlc-legend';
import {
  ResultEmpty,
  ResultError,
  ResultFrame,
  ResultSkeleton,
  ResultUnavailable,
} from './result-states';
import { ChartDataTable } from './time-series-chart';

const PriceChartCanvas = dynamic(
  () => import('./price-chart-canvas').then((mod) => mod.PriceChartCanvas),
  { ssr: false, loading: () => <ResultSkeleton /> }
);

const DAY = 86_400;

type Span = '1w' | '1m' | '3m' | '1y' | 'all';

const SPANS: readonly {
  readonly value: Span;
  readonly label: string;
  readonly ariaLabel: string;
  readonly seconds: number | null;
}[] = [
  { value: '1w', label: '1S', ariaLabel: '1 semaine', seconds: 7 * DAY },
  { value: '1m', label: '1M', ariaLabel: '1 mois', seconds: 30 * DAY },
  { value: '3m', label: '3M', ariaLabel: '3 mois', seconds: 91 * DAY },
  { value: '1y', label: '1A', ariaLabel: '1 an', seconds: 365 * DAY },
  { value: 'all', label: 'Tout', ariaLabel: 'Toute la période', seconds: null },
];

/** Monthly OHLCV rows of the hidden data table. */
function monthlyRows(candles: readonly Candle[]) {
  const months = new Map<string, Candle>();
  for (const candle of candles) {
    const date = new Date(candle.time * 1_000);
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    const month = months.get(key);
    months.set(
      key,
      month
        ? {
            ...month,
            high: Math.max(month.high, candle.high),
            low: Math.min(month.low, candle.low),
            close: candle.close,
            volume: month.volume + candle.volume,
          }
        : candle
    );
  }
  return [...months.values()].map((month) => {
    const date = new Date(month.time * 1_000);
    return [
      `${MONTH_LABELS[date.getUTCMonth()]} ${date.getUTCFullYear()}`,
      formatPrice(month.open),
      formatPrice(month.high),
      formatPrice(month.low),
      formatPrice(month.close),
      formatAmount(month.volume),
    ];
  });
}

interface PriceChartProps {
  readonly result: BacktestResult;
  readonly dataset: RunDataset;
}

function PriceChart({ result, dataset }: PriceChartProps) {
  const [span, setSpan] = useState<Span>('all');
  const [hovered, setHovered] = useState<Candle | null>(null);
  const range = useMemo(() => runRange(result), [result]);
  const query = useDatasetCandles(dataset, range);
  const candles = useMemo(() => query.data?.candles ?? [], [query.data]);
  const markers = useMemo(
    () =>
      tradeMarkers(
        result.trades,
        candles.map((candle) => candle.time)
      ),
    [result.trades, candles]
  );

  if (!range) {
    return (
      <ResultUnavailable description="La période de ce backtest est inconnue." />
    );
  }
  if (query.isPending) return <ResultSkeleton />;
  if (query.isError) {
    return (
      <ResultUnavailable description="Impossible de charger les bougies de ces données." />
    );
  }
  if (candles.length === 0) {
    return (
      <ResultUnavailable description="Aucune bougie sur la période du backtest." />
    );
  }
  const legendCandle = hovered ?? candles[candles.length - 1] ?? null;
  const spanSeconds =
    SPANS.find((option) => option.value === span)?.seconds ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] text-fg-3">
        <span className="min-w-0 truncate font-medium text-fg-2">
          {formatDatasetLabel(dataset)}
        </span>
        {markers.length > 0 ? (
          <span aria-hidden="true" className="flex items-center gap-2">
            <span className="text-gain">▲ achat</span>
            <span className="text-loss">▼ vente</span>
          </span>
        ) : null}
        {query.data?.truncated ? (
          <span>Période tronquée aux premières bougies</span>
        ) : null}
        <SegmentedControl
          label="Période affichée"
          size="sm"
          mono
          className="ml-auto"
          options={SPANS.map(({ value, label, ariaLabel }) => ({
            value,
            label,
            ariaLabel,
          }))}
          value={span}
          onValueChange={setSpan}
        />
      </div>
      <div className="relative min-h-0 flex-1">
        <PriceChartCanvas
          candles={candles}
          markers={markers}
          spanSeconds={spanSeconds}
          onHover={setHovered}
        />
        {legendCandle ? <OhlcLegend candle={legendCandle} /> : null}
      </div>
      <ChartDataTable
        caption={`Prix mensuels de ${formatDatasetLabel(dataset)} : ouverture, plus haut, plus bas, clôture et volume`}
        headers={[
          'Mois',
          'Ouverture',
          'Plus haut',
          'Plus bas',
          'Clôture',
          'Volume',
        ]}
        rows={monthlyRows(candles)}
      />
    </div>
  );
}

/** "Graphique de prix": candlesticks, volume and trades of the run's data. */
export function PriceChartWidget() {
  const view = useResultView();
  const { dataset, known } = useRunDataset();
  return (
    <ResultFrame label="Graphique de prix" busy={view.state === 'loading'}>
      {view.state === 'loading' ? <ResultSkeleton /> : null}
      {view.state === 'empty' ? (
        <ResultEmpty description="Lance un backtest pour voir les bougies de ses données." />
      ) : null}
      {view.state === 'error' ? <ResultError /> : null}
      {view.state === 'ready' ? (
        dataset ? (
          <PriceChart result={view.result} dataset={dataset} />
        ) : known ? (
          <ResultUnavailable description="Les données de ce backtest ne sont plus disponibles." />
        ) : (
          <ResultSkeleton />
        )
      ) : null}
    </ResultFrame>
  );
}
