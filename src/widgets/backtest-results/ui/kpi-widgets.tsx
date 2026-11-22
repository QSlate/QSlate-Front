'use client';

import { type ReactNode, useId } from 'react';

import type { BacktestResult } from '@/entities/backtest';
import { cn } from '@/shared/lib/class-names';
import { Sparkline } from '@/shared/ui';

import {
  directionOf,
  formatAmount,
  formatPercent,
  formatRatio,
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

const TONE_CLASS = {
  up: 'text-gain [text-shadow:0_0_24px_var(--gain-soft)]',
  down: 'text-loss',
  flat: 'text-fg',
} as const;

interface KpiFrameProps {
  readonly label: string;
  readonly render: (result: BacktestResult) => ReactNode;
}

/** Shared states of the KPI widgets. */
function KpiFrame({ label, render }: KpiFrameProps) {
  const view = useResultView();
  return (
    <ResultFrame label={label} busy={view.state === 'loading'}>
      {view.state === 'loading' ? <ResultSkeleton variant="kpi" /> : null}
      {view.state === 'empty' ? <ResultEmpty /> : null}
      {view.state === 'error' ? <ResultError /> : null}
      {view.state === 'ready' ? render(view.result) : null}
    </ResultFrame>
  );
}

interface KpiValueProps {
  readonly value: string;
  readonly tone?: keyof typeof TONE_CLASS | undefined;
  readonly sub?: ReactNode | undefined;
}

function KpiValue({ value, tone = 'flat', sub }: KpiValueProps) {
  return (
    <div className="relative z-[1]">
      <div
        className={cn(
          'whitespace-nowrap font-mono text-[28px] font-semibold leading-[1.1] tracking-[-0.04em] tabular-nums',
          TONE_CLASS[tone]
        )}
      >
        {value}
      </div>
      {sub ? (
        <div className="mt-1 truncate text-[11.5px] text-fg-3">{sub}</div>
      ) : null}
    </div>
  );
}

const NOT_REPORTED = "Le moteur n'a pas fourni cette mesure pour ce backtest.";

/** "Rendement net" with the equity curve as a background sparkline. */
export function NetReturnWidget() {
  return (
    <KpiFrame
      label="Rendement net"
      render={({ metrics, equity }) => {
        const returnPct = metrics.returnPct;
        if (returnPct === null)
          return <ResultUnavailable description={NOT_REPORTED} />;
        const { initialCapital, finalCapital, netProfitUsd } = metrics;
        return (
          <>
            <KpiValue
              value={formatSignedPercent(returnPct)}
              tone={directionOf(returnPct)}
              sub={
                netProfitUsd !== null ? (
                  <>
                    <b className="font-mono font-medium text-fg-2">
                      {formatSignedUsd(netProfitUsd)}
                    </b>
                    {initialCapital !== null && finalCapital !== null ? (
                      <span className="font-mono">
                        {' · '}
                        {formatAmount(initialCapital)} →{' '}
                        {formatAmount(finalCapital)}
                      </span>
                    ) : null}
                  </>
                ) : undefined
              }
            />
            {equity.length > 1 ? (
              <div className="pointer-events-none absolute inset-x-[-14px] bottom-[-12px] h-[46px]">
                <Sparkline
                  data={equity.map((point) => point.equity)}
                  tone={returnPct < 0 ? 'loss' : 'gain'}
                  area
                />
              </div>
            ) : null}
          </>
        );
      }}
    />
  );
}

/** "Baisse maximale" (max drawdown). */
export function MaxDrawdownWidget() {
  return (
    <KpiFrame
      label="Baisse maximale"
      render={({ metrics }) => {
        const drawdown = metrics.maxDrawdownPct;
        if (drawdown === null)
          return <ResultUnavailable description={NOT_REPORTED} />;
        const magnitude = Math.abs(drawdown);
        return (
          <KpiValue
            value={magnitude === 0 ? '0,0 %' : formatSignedPercent(-magnitude)}
            tone={magnitude === 0 ? 'flat' : 'down'}
            sub={
              metrics.maxDrawdownUsd !== null && magnitude > 0 ? (
                <span className="font-mono">
                  {formatSignedUsd(-Math.abs(metrics.maxDrawdownUsd))} au pire
                  moment
                </span>
              ) : (
                'Aucune baisse sur la période'
              )
            }
          />
        );
      }}
    />
  );
}

const GAUGE_MAX = 3;

/** Semicircular 0–3 gauge for the Sharpe ratio. */
function SharpeGauge({ value }: { readonly value: number }) {
  const gradientId = useId();
  const ratio = Math.min(1, Math.max(0, value / GAUGE_MAX));
  const angle = Math.PI * (1 - ratio);
  const x = 33 + 26 * Math.cos(angle);
  const y = 38 - 26 * Math.sin(angle);
  return (
    <svg
      viewBox="0 0 66 44"
      className="h-[44px] w-[66px] flex-none"
      aria-hidden="true"
    >
      <path
        d="M7 38 A26 26 0 0 1 59 38"
        fill="none"
        stroke="var(--line-strong)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {ratio > 0 ? (
        <path
          d={`M7 38 A26 26 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="6"
          strokeLinecap="round"
        />
      ) : null}
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--a1)" />
          <stop offset="100%" stopColor="var(--a2)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function sharpeVerdict(value: number): string {
  if (value < 0) return 'Rendement inférieur au risque pris';
  if (value < 1) return 'Rendement faible pour le risque';
  if (value < 2) return 'Bon rendement pour le risque';
  return 'Excellent rendement pour le risque';
}

/** "Ratio de Sharpe" with a 0–3 gauge. */
export function SharpeWidget() {
  return (
    <KpiFrame
      label="Ratio de Sharpe"
      render={({ metrics }) => {
        const sharpe = metrics.sharpe;
        if (sharpe === null)
          return <ResultUnavailable description={NOT_REPORTED} />;
        return (
          <div className="flex h-full items-end justify-between gap-2">
            <KpiValue
              value={`${sharpe < 0 ? '▼ −' : ''}${formatRatio(Math.abs(sharpe))}`}
              tone={sharpe < 0 ? 'down' : 'flat'}
              sub={sharpeVerdict(sharpe)}
            />
            <SharpeGauge value={sharpe} />
          </div>
        );
      }}
    />
  );
}

function WinRing({ value }: { readonly value: number }) {
  const ratio = Math.min(1, Math.max(0, value / 100));
  const circumference = 2 * Math.PI * 26;
  return (
    <svg
      viewBox="0 0 66 66"
      className="size-[66px] flex-none -rotate-90"
      aria-hidden="true"
    >
      <circle
        cx="33"
        cy="33"
        r="26"
        fill="none"
        stroke="var(--loss-soft)"
        strokeWidth="7"
      />
      <circle
        cx="33"
        cy="33"
        r="26"
        fill="none"
        stroke="var(--gain)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(ratio * circumference).toFixed(2)} ${circumference.toFixed(2)}`}
      />
    </svg>
  );
}

/** "Trades gagnants" with a win/loss ring. */
export function WinRateWidget() {
  return (
    <KpiFrame
      label="Trades gagnants"
      render={({ metrics }) => {
        const total = metrics.totalTrades;
        if (total === 0) {
          return (
            <ResultUnavailable description="Aucun trade n'a été ouvert sur la période." />
          );
        }
        const winRate = metrics.winRatePct;
        if (winRate === null)
          return <ResultUnavailable description={NOT_REPORTED} />;
        const { winningTrades, losingTrades } = metrics;
        return (
          <div className="flex h-full items-end justify-between gap-2">
            <KpiValue
              value={formatPercent(winRate)}
              sub={
                winningTrades !== null && losingTrades !== null ? (
                  <span className="font-mono">
                    {winningTrades} ▲ · {losingTrades} ▼ sur{' '}
                    {total ?? winningTrades + losingTrades}
                  </span>
                ) : undefined
              }
            />
            <WinRing value={winRate} />
          </div>
        );
      }}
    />
  );
}
