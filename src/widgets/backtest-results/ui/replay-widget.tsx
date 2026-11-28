'use client';

import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  Fragment,
  type KeyboardEvent,
  type ReactNode,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { BacktestResult } from '@/entities/backtest';
import {
  type Candle,
  formatDatasetLabel,
  type RunDataset,
  useDatasetCandles,
} from '@/entities/dataset';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';
import {
  iconButtonClassName,
  InfoTip,
  Kbd,
  SegmentedControl,
  Switch,
  Tooltip,
} from '@/shared/ui';

import {
  directionOf,
  formatDay,
  formatDayTime,
  formatPercent,
  formatPrice,
  formatSignedPercent,
  formatSignedUsd,
  formatUsd,
} from '../model/format';
import type { PriceMarker } from '../model/price-markers';
import {
  buildReplayTimeline,
  REPLAY_SPEEDS,
  type ReplayEvent,
  type ReplayFigures,
  type ReplaySpeed,
} from '../model/replay-timeline';
import { runRange, useRunDataset } from '../model/run-dataset';
import { useReplayPlayer } from '../model/use-replay-player';
import { useResultView } from '../model/use-result-view';
import { OhlcLegend } from './ohlc-legend';
import { ReplayScrubber, type ScrubberTick } from './replay-scrubber';
import {
  ResultEmpty,
  ResultError,
  ResultFrame,
  ResultSkeleton,
  ResultUnavailable,
} from './result-states';
import { ChartDataTable } from './time-series-chart';

const ReplayChartCanvas = dynamic(
  () => import('./replay-chart-canvas').then((mod) => mod.ReplayChartCanvas),
  { ssr: false, loading: () => <ResultSkeleton /> }
);

const COUNT = new Intl.NumberFormat('fr-FR');
/** Rows of the hidden orders table (the latest ones). */
const MAX_TABLE_ROWS = 200;
/** Timeline ticks per 100 % of its width (one per 0.25 %). */
const TICK_BUCKETS = 400;

const TONE = {
  up: 'text-gain',
  down: 'text-loss',
  flat: 'text-fg',
} as const;

const SPEED_OPTIONS = REPLAY_SPEEDS.map((speed) => ({
  value: String(speed),
  label: `×${speed}`,
  ariaLabel: `×${speed}, ${speed * 4} bougies par seconde`,
}));

function isSpeed(value: number): value is ReplaySpeed {
  return REPLAY_SPEEDS.some((speed) => speed === value);
}

/** "▲ Achat" / "▼ Vente" with what the order does to the position. */
function eventTitle(event: ReplayEvent): string {
  const glyph = event.action === 'buy' ? '▲ Achat' : '▼ Vente';
  const side = event.trade.side === 'long' ? 'long' : 'short';
  return `${glyph} · ${event.kind === 'entry' ? 'entrée' : 'sortie'} ${side}`;
}

function eventPrice(event: ReplayEvent): number | null {
  return event.kind === 'entry'
    ? event.trade.entryPrice
    : event.trade.exitPrice;
}

/** Sentence for the live region and the hidden table. */
function describeEvent(event: ReplayEvent, time: number): string {
  const action = event.action === 'buy' ? 'Achat' : 'Vente';
  const price = eventPrice(event);
  const parts = [
    `${action}, ${event.kind === 'entry' ? 'entrée' : 'sortie'} ${event.trade.side === 'long' ? 'long' : 'short'}, ${formatDayTime(time)}`,
  ];
  if (price !== null) parts.push(`au prix de ${formatPrice(price)}`);
  if (event.kind === 'exit' && event.trade.pnlPct !== null) {
    parts.push(`résultat ${formatSignedPercent(event.trade.pnlPct, 2)}`);
  }
  return `${parts.join(', ')}.`;
}

interface FigureProps {
  readonly label: string;
  readonly tip: string;
  readonly children: ReactNode;
  readonly className?: string | undefined;
}

function Figure({ label, tip, children, className }: FigureProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1 border-line px-3 first:pl-0 [&:nth-child(3)]:pl-0 @[520px]:border-l @[520px]:first:border-l-0 @[520px]:[&:nth-child(3)]:pl-3',
        className
      )}
    >
      <span className="flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-[0.06em] text-fg-3">
        <span className="truncate">{label}</span>
        <InfoTip label={`À propos : ${label.toLowerCase()}`} content={tip} />
      </span>
      <span className="truncate font-mono text-[15px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-fg">
        {children}
      </span>
    </div>
  );
}

interface ReplayFiguresBarProps {
  readonly figures: ReplayFigures;
  readonly eventTime: number | null;
  /** The latest order happened on the current candle. */
  readonly fresh: boolean;
}

function ReplayFiguresBar({
  figures,
  eventTime,
  fresh,
}: ReplayFiguresBarProps) {
  const {
    capital,
    returnPct,
    drawdownPct,
    closedTrades,
    winRatePct,
    lastEvent,
  } = figures;
  const pnlPct = lastEvent?.kind === 'exit' ? lastEvent.trade.pnlPct : null;
  const pnlUsd = lastEvent?.kind === 'exit' ? lastEvent.trade.pnlUsd : null;
  const price = lastEvent ? eventPrice(lastEvent) : null;
  return (
    <div className="grid grid-cols-2 gap-y-3 @[520px]:grid-cols-4 @[900px]:grid-cols-[repeat(4,minmax(0,auto))_minmax(0,1fr)]">
      <Figure
        label="Capital"
        tip="Capital de la stratégie à la date affichée, d’après la courbe de capital du backtest."
      >
        {capital === null ? '—' : formatUsd(capital)}
      </Figure>
      <Figure
        label="Rendement"
        tip="Variation du capital entre le début du backtest et la date affichée, frais inclus."
      >
        {returnPct === null ? (
          '—'
        ) : (
          <span className={TONE[directionOf(returnPct)]}>
            {formatSignedPercent(returnPct, 2)}
          </span>
        )}
      </Figure>
      <Figure
        label="Baisse depuis le sommet"
        tip="Écart entre le capital à la date affichée et son plus haut atteint jusque-là."
      >
        {drawdownPct === null ? (
          '—'
        ) : (
          <span className={TONE[directionOf(drawdownPct)]}>
            {formatSignedPercent(drawdownPct, 2)}
          </span>
        )}
      </Figure>
      <Figure
        label="Trades clôturés"
        tip="Trades fermés jusqu’à la date affichée, et part de ceux clôturés avec un gain."
      >
        {COUNT.format(closedTrades)}
        {winRatePct === null ? null : (
          <span className="ml-1.5 text-[11px] font-medium tracking-normal text-fg-3">
            {formatPercent(winRatePct)} gagnants
          </span>
        )}
      </Figure>
      <div
        className={cn(
          'col-span-full flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2 @[900px]:col-span-1 @[900px]:ml-3 @[900px]:self-stretch',
          'motion-safe:transition-[border-color,background-color,box-shadow] motion-safe:duration-300',
          fresh
            ? 'border-brand-line bg-brand-soft shadow-[0_0_0_3px_var(--brand-soft)]'
            : 'border-line bg-sunken'
        )}
      >
        {lastEvent && eventTime !== null ? (
          <>
            <span
              aria-hidden="true"
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-lg font-mono text-[12px]',
                lastEvent.action === 'buy'
                  ? 'bg-gain-soft text-gain'
                  : 'bg-loss-soft text-loss'
              )}
            >
              {lastEvent.action === 'buy' ? '▲' : '▼'}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-[0.06em] text-fg-3">
                <span className="truncate">Dernier ordre</span>
                <InfoTip
                  label="À propos : dernier ordre"
                  content="Dernier ordre passé par la stratégie à la date affichée. Le résultat apparaît quand la position est clôturée."
                />
              </span>
              <span className="flex min-w-0 items-baseline gap-2 truncate font-mono text-[12px] tabular-nums">
                <b
                  className={cn(
                    'font-semibold',
                    lastEvent.action === 'buy' ? 'text-gain' : 'text-loss'
                  )}
                >
                  {eventTitle(lastEvent)}
                </b>
                {price === null ? null : (
                  <span className="text-fg">{formatPrice(price)}</span>
                )}
                {pnlPct === null ? null : (
                  <span className={TONE[directionOf(pnlPct)]}>
                    {formatSignedPercent(pnlPct, 2)}
                    {pnlUsd === null ? null : ` (${formatSignedUsd(pnlUsd)})`}
                  </span>
                )}
              </span>
            </span>
          </>
        ) : (
          <span className="text-[11.5px] text-fg-3">
            Aucun ordre de la stratégie pour l’instant.
          </span>
        )}
      </div>
    </div>
  );
}

interface TransportButtonProps {
  readonly label: string;
  /** `aria-keyshortcuts` value, e.g. "Shift+ArrowRight". */
  readonly shortcut: string;
  /** Keys as shown in the tooltip, e.g. "Maj →". */
  readonly keys: string;
  readonly icon: ReactNode;
  readonly onClick: () => void;
  readonly disabled?: boolean | undefined;
}

function TransportButton({
  label,
  shortcut,
  keys,
  icon,
  onClick,
  disabled,
}: TransportButtonProps) {
  return (
    <Tooltip
      side="top"
      content={
        <span className="flex items-center gap-2 whitespace-nowrap">
          {label}
          <Kbd>{keys}</Kbd>
        </span>
      }
    >
      {(triggerProps) => (
        <button
          type="button"
          aria-label={label}
          aria-keyshortcuts={shortcut}
          disabled={disabled}
          onClick={onClick}
          {...triggerProps}
          className={iconButtonClassName('quiet', 'sm', '[&_svg]:size-4')}
        >
          <span aria-hidden="true" className="inline-flex">
            {icon}
          </span>
        </button>
      )}
    </Tooltip>
  );
}

const SHORTCUTS: readonly (readonly [keys: string, label: string])[] = [
  ['Espace', 'Lecture ou pause'],
  ['← →', 'Bougie par bougie'],
  ['Maj ← →', 'Trade par trade'],
  ['Début Fin', 'Début ou fin du replay'],
];

function ShortcutsHint() {
  return (
    <Tooltip
      side="top"
      align="end"
      content={
        <span className="flex w-[216px] flex-col gap-2">
          <b className="font-semibold">Raccourcis clavier</b>
          <span className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5">
            {SHORTCUTS.map(([keys, label]) => (
              <Fragment key={keys}>
                <Kbd className="justify-self-start whitespace-nowrap">
                  {keys}
                </Kbd>
                <span className="whitespace-nowrap">{label}</span>
              </Fragment>
            ))}
          </span>
          <span className="opacity-70">
            Actifs quand le focus est dans le replay.
          </span>
        </span>
      }
    >
      {(triggerProps) => (
        <button
          type="button"
          aria-label="Raccourcis clavier"
          {...triggerProps}
          className={iconButtonClassName('quiet', 'sm', '[&_svg]:size-4')}
        >
          <Keyboard aria-hidden="true" />
        </button>
      )}
    </Tooltip>
  );
}

/** One tick per timeline bucket, so dense runs stay readable. */
function scrubberTicks(
  events: readonly ReplayEvent[],
  lastIndex: number
): ScrubberTick[] {
  const ticks: ScrubberTick[] = [];
  let bucket = -1;
  for (const event of events) {
    const next = Math.round(
      (event.candleIndex / Math.max(lastIndex, 1)) * TICK_BUCKETS
    );
    if (next === bucket) continue;
    bucket = next;
    ticks.push({ candleIndex: event.candleIndex, action: event.action });
  }
  return ticks;
}

interface ReplayProps {
  readonly result: BacktestResult;
  readonly dataset: RunDataset;
  readonly candles: readonly Candle[];
  readonly truncated: boolean;
}

function Replay({ result, dataset, candles, truncated }: ReplayProps) {
  const timeline = useMemo(
    () =>
      buildReplayTimeline(
        result,
        candles.map((candle) => candle.time)
      ),
    [result, candles]
  );
  const player = useReplayPlayer(timeline);
  const [hovered, setHovered] = useState<Candle | null>(null);
  const stopLabelId = useId();
  const lastIndex = Math.max(candles.length - 1, 0);
  const { cursor, playing, ended } = player;
  const candle = candles[cursor] ?? null;
  const legendCandle = hovered ?? candle;
  const playButtonRef = useRef<HTMLButtonElement>(null);
  // The intro overlay shows until the replay first moves.
  const [started, setStarted] = useState(false);
  if (!started && (cursor > 0 || playing)) setStarted(true);

  const markers = useMemo<readonly PriceMarker[]>(
    () =>
      timeline.events.map((event) => ({
        time: candles[event.candleIndex]?.time ?? 0,
        action: event.action,
      })),
    [timeline, candles]
  );
  const ticks = useMemo(
    () => scrubberTicks(timeline.events, lastIndex),
    [timeline, lastIndex]
  );
  const markerCount = timeline.eventCountAt(cursor);
  const figures = timeline.figuresAt(cursor);
  const lastEvent = figures.lastEvent;
  const eventTime = lastEvent
    ? (candles[lastEvent.candleIndex]?.time ?? null)
    : null;
  const fresh = lastEvent?.candleIndex === cursor;

  const tableRows = useMemo(
    () =>
      timeline.events
        .slice(Math.max(0, markerCount - MAX_TABLE_ROWS), markerCount)
        .map((event) => {
          const time = candles[event.candleIndex]?.time ?? 0;
          const price = eventPrice(event);
          const pnl = event.kind === 'exit' ? event.trade.pnlPct : null;
          return [
            formatDayTime(time),
            eventTitle(event),
            price === null ? '—' : formatPrice(price),
            pnl === null ? '—' : formatSignedPercent(pnl, 2),
          ];
        }),
    [timeline, candles, markerCount]
  );

  const first = candles[0];
  const last = candles[lastIndex];
  const position = `bougie ${COUNT.format(cursor + 1)} sur ${COUNT.format(candles.length)}`;
  const dateLabel = candle ? formatDayTime(candle.time) : '—';
  const announcement = playing
    ? ''
    : ended
      ? `Fin du replay, ${dateLabel}.`
      : fresh && lastEvent && eventTime !== null
        ? describeEvent(lastEvent, eventTime)
        : '';

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    // The speed selector moves between its options with its own keys.
    if (event.key !== ' ' && target?.closest('[data-replay-own-keys]')) return;
    switch (event.key) {
      case ' ': {
        // A focused button keeps its own Space activation.
        if (target?.closest('button')) return;
        event.preventDefault();
        player.toggle();
        return;
      }
      case 'ArrowLeft':
      case 'ArrowRight': {
        event.preventDefault();
        const forward = event.key === 'ArrowRight';
        if (event.shiftKey) {
          if (forward) player.toNextTrade();
          else player.toPreviousTrade();
        } else {
          player.step(forward ? 1 : -1);
        }
        return;
      }
      case 'Home':
        event.preventDefault();
        player.seek(0);
        return;
      case 'End':
        event.preventDefault();
        player.seek(lastIndex);
        return;
      default:
    }
  };

  const playLabel = playing
    ? 'Pause'
    : ended
      ? 'Rejouer depuis le début'
      : 'Lecture';

  return (
    // Shortcuts for the whole replay; every control stays a real button.
    <div
      className="@container flex h-full min-h-0 flex-col gap-3"
      onKeyDown={handleKeyDown}
    >
      <ReplayFiguresBar figures={figures} eventTime={eventTime} fresh={fresh} />

      <div
        tabIndex={-1}
        className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-line-2 bg-[color-mix(in_srgb,var(--sunken)_55%,transparent)] outline-none"
      >
        <ReplayChartCanvas
          candles={candles}
          cursor={cursor}
          markers={markers}
          markerCount={markerCount}
          onHover={setHovered}
        />
        {legendCandle ? <OhlcLegend candle={legendCandle} /> : null}
        {started ? null : (
          <div className="absolute inset-0 z-[3] grid place-items-center bg-[color-mix(in_srgb,var(--surface)_55%,transparent)] p-4 backdrop-blur-[2px]">
            <div className="flex max-w-[300px] flex-col items-center gap-2.5 text-center">
              <button
                type="button"
                onClick={() => {
                  player.toggle();
                  // The overlay leaves: keep the focus inside the replay.
                  playButtonRef.current?.focus();
                }}
                aria-label="Lancer le replay"
                className={cn(
                  FOCUS_RING,
                  'grid size-14 place-items-center rounded-full border-0 bg-brand-gradient text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_14px_32px_-10px_var(--glow),0_0_0_6px_var(--brand-soft)] hover:brightness-110 motion-safe:transition-[filter,transform] motion-safe:active:scale-95'
                )}
              >
                <Play
                  aria-hidden="true"
                  className="ml-0.5 size-6 fill-current"
                />
              </button>
              <b className="text-[13px] font-semibold text-fg">
                Rejoue ce backtest bougie par bougie
              </b>
              <span className="text-[11.5px] leading-relaxed text-fg-3">
                Le prix se dévoile et les ordres de la stratégie apparaissent au
                moment où ils ont eu lieu.
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-fg-3">
                <Kbd>Espace</Kbd> lecture · <Kbd>← →</Kbd> bougie par bougie
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <ReplayScrubber
          cursor={cursor}
          lastIndex={lastIndex}
          ticks={ticks}
          valueText={`${dateLabel}, ${position}`}
          startLabel={first ? formatDay(first.time) : ''}
          endLabel={last ? formatDay(last.time) : ''}
          onSeek={player.seek}
        />
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 @[760px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-mono text-[13px] font-semibold tabular-nums tracking-[-0.01em] text-fg">
              {dateLabel}
            </span>
            <span className="truncate text-[11px] text-fg-3">
              {formatDatasetLabel(dataset)} ·{' '}
              <span className="font-mono tabular-nums">
                {COUNT.format(cursor + 1)} / {COUNT.format(candles.length)}
              </span>
              {truncated ? ' · période tronquée' : null}
              {timeline.events.length > 0 ? (
                <span aria-hidden="true">
                  {' · '}
                  <span className="text-gain">▲ achat</span>{' '}
                  <span className="text-loss">▼ vente</span>
                </span>
              ) : null}
            </span>
          </div>

          <div
            role="group"
            aria-label="Lecteur"
            className="col-span-2 row-start-2 flex items-center gap-0.5 justify-self-center @[760px]:col-span-1 @[760px]:col-start-2 @[760px]:row-start-1"
          >
            <TransportButton
              label="Revenir au début"
              shortcut="Home"
              keys="Début"
              icon={<ChevronFirst />}
              onClick={() => player.seek(0)}
              disabled={cursor === 0}
            />
            <TransportButton
              label="Trade précédent"
              shortcut="Shift+ArrowLeft"
              keys="Maj ←"
              icon={<SkipBack />}
              onClick={player.toPreviousTrade}
              disabled={timeline.previousEventCandle(cursor) === null}
            />
            <TransportButton
              label="Bougie précédente"
              shortcut="ArrowLeft"
              keys="←"
              icon={<ChevronLeft />}
              onClick={() => player.step(-1)}
              disabled={cursor === 0}
            />
            <Tooltip
              side="top"
              content={
                <span className="flex items-center gap-2 whitespace-nowrap">
                  {playLabel}
                  <Kbd>Espace</Kbd>
                </span>
              }
            >
              {(triggerProps) => (
                <button
                  type="button"
                  aria-label={playLabel}
                  ref={playButtonRef}
                  aria-keyshortcuts="Space"
                  onClick={player.toggle}
                  {...triggerProps}
                  className={cn(
                    FOCUS_RING,
                    'mx-1.5 grid size-10 place-items-center rounded-full border-0 bg-brand-gradient text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_8px_22px_-8px_var(--glow),0_0_0_1px_var(--brand-line)] hover:brightness-110 motion-safe:transition-[filter,transform] motion-safe:active:scale-95'
                  )}
                >
                  {playing ? (
                    <Pause
                      aria-hidden="true"
                      className="size-[18px] fill-current"
                    />
                  ) : ended ? (
                    <RotateCcw aria-hidden="true" className="size-[18px]" />
                  ) : (
                    <Play
                      aria-hidden="true"
                      className="ml-0.5 size-[18px] fill-current"
                    />
                  )}
                </button>
              )}
            </Tooltip>
            <TransportButton
              label="Bougie suivante"
              shortcut="ArrowRight"
              keys="→"
              icon={<ChevronRight />}
              onClick={() => player.step(1)}
              disabled={ended}
            />
            <TransportButton
              label="Trade suivant"
              shortcut="Shift+ArrowRight"
              keys="Maj →"
              icon={<SkipForward />}
              onClick={player.toNextTrade}
              disabled={timeline.nextEventCandle(cursor) === null}
            />
            <TransportButton
              label="Aller à la fin"
              shortcut="End"
              keys="Fin"
              icon={<ChevronLast />}
              onClick={() => player.seek(lastIndex)}
              disabled={ended}
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 @[760px]:col-start-3 @[760px]:row-start-1">
            <span className="flex items-center gap-2">
              <span id={stopLabelId} className="text-[11.5px] text-fg-2">
                Pause sur les trades
              </span>
              <Tooltip
                side="top"
                content="Met le replay en pause à chaque achat ou vente de la stratégie, pour regarder l’ordre de près."
              >
                {(triggerProps) => (
                  <Switch
                    checked={player.stopOnTrades}
                    onCheckedChange={player.setStopOnTrades}
                    aria-labelledby={stopLabelId}
                    {...triggerProps}
                  />
                )}
              </Tooltip>
            </span>
            <span data-replay-own-keys="">
              <SegmentedControl
                label="Vitesse de lecture"
                size="sm"
                mono
                options={SPEED_OPTIONS}
                value={String(player.speed)}
                onValueChange={(value) => {
                  const speed = Number(value);
                  if (isSpeed(speed)) player.setSpeed(speed);
                }}
              />
            </span>
            <ShortcutsHint />
          </div>
        </div>
      </div>

      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>
      <ChartDataTable
        caption={`Ordres de la stratégie jusqu’au ${dateLabel} (${MAX_TABLE_ROWS} derniers au plus)`}
        headers={['Date', 'Ordre', 'Prix', 'Résultat']}
        rows={tableRows}
      />
    </div>
  );
}

interface ReplayLoaderProps {
  readonly result: BacktestResult;
  readonly dataset: RunDataset;
}

function ReplayLoader({ result, dataset }: ReplayLoaderProps) {
  const range = useMemo(() => runRange(result), [result]);
  const query = useDatasetCandles(dataset, range);
  const candles = useMemo(() => query.data?.candles ?? [], [query.data]);

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
  if (candles.length < 2) {
    return (
      <ResultUnavailable description="Pas assez de bougies sur la période du backtest pour le rejouer." />
    );
  }
  return (
    <Replay
      // A new run starts a new replay from its first candle.
      key={result.id}
      result={result}
      dataset={dataset}
      candles={candles}
      truncated={query.data?.truncated ?? false}
    />
  );
}

/** "Replay du backtest": the run replayed candle by candle, with its orders. */
export function ReplayWidget() {
  const view = useResultView();
  const { dataset, known } = useRunDataset();
  return (
    <ResultFrame label="Replay du backtest" busy={view.state === 'loading'}>
      {view.state === 'loading' ? <ResultSkeleton /> : null}
      {view.state === 'empty' ? (
        <ResultEmpty description="Lance un backtest pour le rejouer bougie par bougie." />
      ) : null}
      {view.state === 'error' ? <ResultError /> : null}
      {view.state === 'ready' ? (
        dataset ? (
          <ReplayLoader result={view.result} dataset={dataset} />
        ) : known ? (
          <ResultUnavailable description="Les données de ce backtest ne sont plus disponibles." />
        ) : (
          <ResultSkeleton />
        )
      ) : null}
    </ResultFrame>
  );
}
