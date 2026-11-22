'use client';

import { useCallback, useMemo } from 'react';

import type { StrategyParameterValue } from '@/entities/backtest';
import { useRunnableDatasets } from '@/entities/dataset';
import { useStrategies, useStrategy } from '@/entities/strategy';
import { useAuthStore } from '@/entities/user';
import {
  buildRunRequest,
  type ComposerFieldErrors,
  type ComposerPatch,
  type ComposerSelection,
  countAdvancedChanges,
  resolveDataset,
  resolveStrategy,
  useComposerSelection,
  useComposerStore,
  validateComposerFields,
} from '@/features/compose-backtest';
import { useBacktest } from '@/features/run-backtest';
import type { CustomDataset, StrategySummary } from '@/shared/api';
import { useHydratedStore } from '@/shared/lib/store';

/** Why the run cannot start, with the page that fixes it when relevant. */
export interface RunBlockReason {
  readonly message: string;
  readonly href?: string | undefined;
  readonly linkLabel?: string | undefined;
}

export interface RunComposerModel {
  readonly selection: ComposerSelection;
  readonly strategies: readonly StrategySummary[];
  readonly datasets: readonly CustomDataset[];
  readonly strategy: StrategySummary | null;
  readonly dataset: CustomDataset | null;
  /** A stored selection no longer exists in the current list. */
  readonly strategyMissing: boolean;
  readonly datasetMissing: boolean;
  /** Saved default parameters of the selected strategy, once loaded. */
  readonly strategyDefaults: Readonly<Record<string, unknown>> | null;
  readonly fieldErrors: ComposerFieldErrors;
  readonly advancedChanges: number;
  readonly isLoading: boolean;
  readonly blockReason: RunBlockReason | null;
  readonly canRun: boolean;
  readonly isRunning: boolean;
  readonly update: (patch: ComposerPatch) => void;
  readonly setParameter: (
    key: string,
    value: StrategyParameterValue | null
  ) => void;
  readonly resetAdvanced: () => void;
  readonly submit: () => void;
  readonly stop: () => void;
}

const ANONYMOUS_USER_KEY = 'anonymous';

/** Composer state of the signed-in user plus everything needed to run. */
export function useRunComposer(): RunComposerModel {
  const userId = useHydratedStore(
    useAuthStore,
    (state) => state.user?.id ?? null,
    null
  );
  const userKey = userId === null ? ANONYMOUS_USER_KEY : String(userId);
  const selection = useComposerSelection(userKey);
  const updateStore = useComposerStore((state) => state.update);
  const setParameterStore = useComposerStore((state) => state.setParameter);
  const resetStore = useComposerStore((state) => state.resetAdvanced);

  const strategiesQuery = useStrategies();
  const datasetsQuery = useRunnableDatasets();
  const strategies = useMemo(
    () => strategiesQuery.data ?? [],
    [strategiesQuery.data]
  );
  const datasets = useMemo(
    () => datasetsQuery.data ?? [],
    [datasetsQuery.data]
  );
  const strategyResolution = resolveStrategy(selection, strategies);
  const datasetResolution = resolveDataset(selection, datasets);
  const strategy = strategyResolution.item;
  const dataset = datasetResolution.item;
  const detail = useStrategy(strategy?.id ?? null);
  const strategyDefaults =
    detail.data && detail.data.id === strategy?.id
      ? detail.data.parameters
      : null;

  const { status, run, cancel } = useBacktest();
  const isRunning = status === 'running';
  const isLoading = strategiesQuery.isPending || datasetsQuery.isPending;
  const fieldErrors = validateComposerFields(selection);
  const built = buildRunRequest({
    selection,
    strategies,
    datasets,
    strategyDefaults,
  });

  let blockReason: RunBlockReason | null = null;
  if (strategiesQuery.isError || datasetsQuery.isError) {
    blockReason = {
      message:
        'Impossible de charger tes stratégies ou tes données. Vérifie ta connexion puis recharge la page.',
    };
  } else if (isLoading) {
    blockReason = { message: 'Chargement de tes stratégies et données…' };
  } else if (!built.ok) {
    const [first] = built.blockers;
    if (first?.kind === 'no-strategy') {
      blockReason = {
        message: 'Crée ou importe une stratégie pour lancer un backtest.',
        href: '/lab/ide',
        linkLabel: "Ouvrir l'éditeur",
      };
    } else if (first?.kind === 'no-dataset') {
      blockReason = {
        message: 'Importe un jeu de données pour lancer un backtest.',
        href: '/lab/data',
        linkLabel: 'Gérer mes données',
      };
    } else if (first?.kind === 'missing-strategy') {
      blockReason = {
        message:
          'Sélection introuvable : la stratégie choisie a été supprimée. Choisis-en une autre.',
      };
    } else if (first?.kind === 'missing-dataset') {
      blockReason = {
        message:
          "Sélection introuvable : le jeu de données choisi a été supprimé ou n'est plus prêt. Choisis-en un autre.",
      };
    } else if (first?.kind === 'invalid-field') {
      blockReason = {
        message:
          fieldErrors[first.field] ?? 'Corrige les réglages pour lancer.',
      };
    }
  }

  const canRun = built.ok && !isLoading && !isRunning;
  const request = built.ok ? built.request : null;

  const update = useCallback(
    (patch: ComposerPatch) => updateStore(userKey, patch),
    [updateStore, userKey]
  );
  const strategyId = strategy?.id ?? null;
  const setParameter = useCallback(
    (key: string, value: StrategyParameterValue | null) => {
      if (strategyId !== null)
        setParameterStore(userKey, strategyId, key, value);
    },
    [setParameterStore, userKey, strategyId]
  );
  const resetAdvanced = useCallback(
    () => resetStore(userKey, strategyId),
    [resetStore, userKey, strategyId]
  );
  const submit = useCallback(() => {
    if (canRun && request) void run(request);
  }, [canRun, request, run]);

  return {
    selection,
    strategies,
    datasets,
    strategy,
    dataset,
    strategyMissing: strategyResolution.missing,
    datasetMissing: datasetResolution.missing,
    strategyDefaults,
    fieldErrors,
    advancedChanges: countAdvancedChanges(
      selection,
      strategyId,
      strategyDefaults
    ),
    isLoading,
    blockReason,
    canRun,
    isRunning,
    update,
    setParameter,
    resetAdvanced,
    submit,
    stop: cancel,
  };
}
