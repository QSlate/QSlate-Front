'use client';

import { useMemo, useState } from 'react';

import type { BacktestMetrics } from '@/entities/backtest';
import {
  describeParameters,
  type ParameterField,
} from '@/features/compose-backtest';
import { useLabStore } from '@/features/lab-state';
import {
  buildSearchSpace,
  gridSize,
  MAX_OPTIMIZATION_TRIALS,
  type OptimizationMethod,
  type OptimizationTrial,
  type ParameterRange,
  useOptimizationTrials,
  useStartOptimization,
  validateOptimization,
  validateRange,
} from '@/features/optimize-strategy';
import type { OptimizationBatch } from '@/shared/api';
import { cn } from '@/shared/lib/class-names';
import {
  Badge,
  Button,
  Dialog,
  NumberInput,
  ProgressBar,
  SegmentedControl,
  Switch,
} from '@/shared/ui';

import type { RunComposerModel } from '../model/use-run-composer';

type SortKey = 'sharpe' | 'return' | 'drawdown';

const SORT_OPTIONS = [
  { value: 'sharpe', label: 'Sharpe' },
  { value: 'return', label: 'Rendement' },
  { value: 'drawdown', label: 'Baisse' },
] as const;

const METHOD_OPTIONS = [
  { value: 'grid_search', label: 'Grille' },
  { value: 'monte_carlo', label: 'Aléatoire' },
] as const;

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

function isSort(value: string): value is SortKey {
  return SORT_OPTIONS.some((option) => option.value === value);
}

function isMethod(value: string): value is OptimizationMethod {
  return METHOD_OPTIONS.some((option) => option.value === value);
}

interface RangeDraft extends ParameterRange {
  readonly enabled: boolean;
  readonly label: string;
}

function initialRange(
  field: ParameterField,
  value: number,
  enabled: boolean
): RangeDraft {
  const spread = value === 0 ? 1 : Math.abs(value) / 2;
  const round = (raw: number) =>
    field.integer ? Math.round(raw) : Number(raw.toPrecision(6));
  return {
    key: field.key,
    label: field.label,
    integer: field.integer,
    enabled,
    steps: 3,
    min: field.min ?? round(value - spread),
    max: field.max ?? round(value + spread),
  };
}

function sortValue(metrics: BacktestMetrics, key: SortKey): number | null {
  if (key === 'sharpe') return metrics.sharpe;
  if (key === 'return') return metrics.returnPct;
  return metrics.maxDrawdownPct === null
    ? null
    : -Math.abs(metrics.maxDrawdownPct);
}

function signed(value: number | null, unit: string): string {
  if (value === null) return '—';
  return `${value > 0 ? '▲ +' : value < 0 ? '▼ −' : ''}${NUMBER.format(Math.abs(value))}${unit}`;
}

interface OptimizeDialogProps {
  readonly model: RunComposerModel;
  readonly onClose: () => void;
}

/** Parameter search on the lab service, ranked on the real trial summaries. */
export function OptimizeDialog({ model, onClose }: OptimizeDialogProps) {
  const {
    strategy,
    strategyDefaults,
    parameterSchema,
    selection,
    request,
    setParameter,
  } = model;
  const showToast = useLabStore((state) => state.showToast);
  const numericFields = useMemo(
    () =>
      strategyDefaults
        ? describeParameters(strategyDefaults, parameterSchema).filter(
            (field) => field.kind === 'number'
          )
        : [],
    [strategyDefaults, parameterSchema]
  );
  const overrides = strategy
    ? (selection.parameterOverrides[strategy.id] ?? {})
    : {};
  const [ranges, setRanges] = useState<readonly RangeDraft[]>(() =>
    numericFields.map((field, index) => {
      const current = overrides[field.key];
      const value =
        typeof current === 'number' ? current : Number(field.defaultValue);
      return initialRange(field, value, index < 2);
    })
  );
  const [method, setMethod] = useState<OptimizationMethod>('grid_search');
  const [maxRuns, setMaxRuns] = useState<number | null>(9);
  const [sortKey, setSortKey] = useState<SortKey>('sharpe');
  const [batch, setBatch] = useState<OptimizationBatch | null>(null);
  const start = useStartOptimization();
  const trials = useOptimizationTrials(batch);

  const active = ranges.filter((range) => range.enabled);
  const space = buildSearchSpace(active);
  const size = active.length > 0 ? gridSize(space) : 0;
  const runs = maxRuns ?? 0;
  const error = request
    ? validateOptimization(method, active, runs)
    : 'Corrige la sélection du composer avant d’optimiser.';

  const patch = (key: string, change: Partial<RangeDraft>) =>
    setRanges((current) =>
      current.map((range) =>
        range.key === key ? { ...range, ...change } : range
      )
    );

  const launch = () => {
    if (!request || error) return;
    start.mutate(
      {
        request,
        method,
        searchSpace: space,
        maxRuns: method === 'grid_search' ? size : runs,
      },
      {
        onSuccess: setBatch,
        onError: (cause) =>
          showToast(
            cause instanceof Error
              ? `Optimisation refusée : ${cause.message}`
              : 'Optimisation refusée.',
            'error'
          ),
      }
    );
  };

  const list = trials.data ?? [];
  const done = list.filter(
    (trial) => trial.status !== 'queued' && trial.status !== 'running'
  ).length;
  const ranked = [...list]
    .filter(
      (trial): trial is OptimizationTrial & { metrics: BacktestMetrics } =>
        trial.metrics !== null
    )
    .sort(
      (a, b) =>
        (sortValue(b.metrics, sortKey) ?? -Infinity) -
        (sortValue(a.metrics, sortKey) ?? -Infinity)
    );
  const failed = list.filter(
    (trial) => trial.status === 'failed' || trial.status === 'cancelled'
  ).length;

  const apply = (trial: OptimizationTrial) => {
    for (const field of numericFields) {
      const value = trial.parameters[field.key];
      if (typeof value === 'number')
        setParameter(field.key, value === field.defaultValue ? null : value);
    }
    showToast('Paramètres appliqués au composer', 'success');
    onClose();
  };

  return (
    <Dialog
      title="Optimiser les paramètres"
      description={
        strategy
          ? `Chaque essai est un vrai backtest de ${strategy.name} sur les données et la période choisies.`
          : undefined
      }
      onClose={onClose}
      className="w-[min(760px,calc(100vw-32px))]"
      footer={
        batch ? (
          <Button onClick={onClose}>Fermer</Button>
        ) : (
          <>
            <Button variant="quiet" onClick={onClose}>
              Annuler
            </Button>
            <Button
              disabled={Boolean(error) || start.isPending}
              onClick={launch}
            >
              {start.isPending
                ? 'Envoi…'
                : `Lancer ${method === 'grid_search' ? size : runs} essais`}
            </Button>
          </>
        )
      }
    >
      {!batch ? (
        numericFields.length === 0 ? (
          <p className="m-0 text-xs text-fg-3">
            Cette stratégie n&apos;a aucun paramètre numérique à explorer.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <table className="w-full border-collapse text-[12.5px]">
              <caption className="sr-only">Plages explorées</caption>
              <thead>
                <tr className="text-left text-[11px] text-fg-3">
                  {['Explorer', 'Paramètre', 'Min', 'Max', 'Valeurs'].map(
                    (header) => (
                      <th
                        key={header}
                        scope="col"
                        className="border-b border-line px-1.5 py-1.5 font-medium"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {ranges.map((range) => {
                  const rangeError = range.enabled
                    ? validateRange(range)
                    : null;
                  return (
                    <tr
                      key={range.key}
                      className="border-b border-[var(--line-2)]"
                    >
                      <td className="px-1.5 py-1.5">
                        <Switch
                          aria-label={`Explorer ${range.label}`}
                          checked={range.enabled}
                          onCheckedChange={(enabled) =>
                            patch(range.key, { enabled })
                          }
                        />
                      </td>
                      <td className="px-1.5 py-1.5 text-fg">
                        {range.label}
                        {rangeError ? (
                          <span className="block text-[11px] text-loss">
                            {rangeError}
                          </span>
                        ) : null}
                      </td>
                      {(['min', 'max', 'steps'] as const).map((part) => (
                        <td key={part} className="w-[96px] px-1.5 py-1.5">
                          <NumberInput
                            aria-label={`${range.label} : ${part === 'steps' ? 'nombre de valeurs' : part}`}
                            value={range[part]}
                            disabled={!range.enabled}
                            step={part === 'steps' || range.integer ? 1 : 'any'}
                            onValueChange={(value) =>
                              patch(range.key, { [part]: value ?? Number.NaN })
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-fg-2">
              <SegmentedControl
                label="Méthode"
                options={METHOD_OPTIONS}
                value={method}
                onValueChange={(value) => {
                  if (isMethod(value)) setMethod(value);
                }}
              />
              {method === 'grid_search' ? (
                <span className="font-mono text-fg-3">
                  {size} combinaison{size > 1 ? 's' : ''} · max{' '}
                  {MAX_OPTIMIZATION_TRIALS}
                </span>
              ) : (
                <label className="flex items-center gap-2">
                  Essais
                  <NumberInput
                    aria-label="Nombre d'essais"
                    value={maxRuns}
                    step={1}
                    min={1}
                    max={MAX_OPTIMIZATION_TRIALS}
                    onValueChange={setMaxRuns}
                    frameClassName="w-[84px]"
                  />
                </label>
              )}
            </div>
            {error ? (
              <p role="alert" className="m-0 text-xs text-loss">
                {error}
              </p>
            ) : null}
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <ProgressBar
              value={list.length ? (done / list.length) * 100 : 0}
              label="Essais terminés"
              className="flex-1"
            />
            <span role="status" className="font-mono text-xs text-fg-2">
              {done} / {batch.backtests.length} terminés
              {failed ? ` · ${failed} en échec` : ''}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-fg-3">
              Classement des essais terminés
            </span>
            <SegmentedControl
              label="Trier par"
              size="sm"
              options={SORT_OPTIONS}
              value={sortKey}
              onValueChange={(value) => {
                if (isSort(value)) setSortKey(value);
              }}
            />
          </div>
          {ranked.length === 0 ? (
            <p className="m-0 text-xs text-fg-3">
              Les résultats apparaissent dès qu&apos;un essai est terminé.
            </p>
          ) : (
            <div className="max-h-[320px] overflow-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <caption className="sr-only">Résultats des essais</caption>
                <thead className="sticky top-0 bg-surface">
                  <tr className="text-left text-[11px] text-fg-3">
                    {[
                      '#',
                      'Paramètres',
                      'Sharpe',
                      'Rendement',
                      'Baisse max',
                      '',
                    ].map((header) => (
                      <th
                        key={header || 'action'}
                        scope="col"
                        className="border-b border-line px-2 py-1.5 font-medium"
                      >
                        {header || <span className="sr-only">Action</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((trial, index) => (
                    <tr
                      key={trial.backtestId}
                      className="border-b border-[var(--line-2)]"
                    >
                      <td className="px-2 py-1.5 font-mono text-fg-3">
                        {index + 1}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-[11.5px] text-fg-2">
                        {Object.entries(trial.parameters)
                          .filter(([key]) =>
                            active.some((range) => range.key === key)
                          )
                          .map(([key, value]) => `${key}=${String(value)}`)
                          .join(' · ')}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono">
                        {trial.metrics.sharpe === null
                          ? '—'
                          : NUMBER.format(trial.metrics.sharpe)}
                      </td>
                      <td
                        className={cn(
                          'px-2 py-1.5 text-right font-mono',
                          (trial.metrics.returnPct ?? 0) > 0 && 'text-gain',
                          (trial.metrics.returnPct ?? 0) < 0 && 'text-loss'
                        )}
                      >
                        {signed(trial.metrics.returnPct, ' %')}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-fg-2">
                        {trial.metrics.maxDrawdownPct === null
                          ? '—'
                          : `${NUMBER.format(Math.abs(trial.metrics.maxDrawdownPct))} %`}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        {index === 0 ? (
                          <Badge tone="gain" className="mr-1.5">
                            Meilleur
                          </Badge>
                        ) : null}
                        <Button
                          size="sm"
                          variant={index === 0 ? 'primary' : 'secondary'}
                          onClick={() => apply(trial)}
                        >
                          Appliquer ces paramètres
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
