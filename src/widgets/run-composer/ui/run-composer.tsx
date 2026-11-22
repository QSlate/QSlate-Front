'use client';

import {
  CalendarRange,
  Database,
  Play,
  SlidersHorizontal,
  Square,
} from 'lucide-react';
import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { formatDatasetLabel } from '@/entities/dataset';
import {
  isPeriodPreset,
  PERIOD_LABELS,
  PERIOD_PRESETS,
} from '@/features/compose-backtest';
import { cn } from '@/shared/lib/class-names';
import { Button, IconButton, Kbd, Tooltip } from '@/shared/ui';

import { useComposerNotice } from '../model/composer-notice';
import { useRunComposer } from '../model/use-run-composer';
import { AdvancedSettingsDrawer } from './advanced-settings-drawer';
import {
  ComposerSelectToken,
  TOKEN_CLASS,
  TOKEN_META_CLASS,
} from './composer-token';
import { RUN_COMPOSER_HINT_ID } from './run-composer-hint';

const subscribePlatform = () => () => {};
const getPlatformShortcut = () =>
  /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘↵' : 'Ctrl↵';
const getServerShortcut = () => 'Ctrl↵';

function Separator() {
  return <span aria-hidden="true" className="h-[22px] w-px bg-line-strong" />;
}

/**
 * Header "composer" pill: strategy, dataset and capital, then the run
 * button (⌘/Ctrl + Enter), which becomes "Arrêter" while a run is active.
 */
export function RunComposer() {
  const model = useRunComposer();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const {
    selection,
    strategies,
    datasets,
    strategy,
    dataset,
    fieldErrors,
    blockReason,
    advancedChanges,
    canRun,
    isRunning,
    isCancelling,
    update,
    submit,
    stop,
  } = model;
  const announce = useComposerNotice((state) => state.announce);
  const shortcut = useSyncExternalStore(
    subscribePlatform,
    getPlatformShortcut,
    getServerShortcut
  );

  // Latest shortcut behaviour, read by the window listener below.
  const shortcutRef = useRef(() => {});
  useEffect(() => {
    shortcutRef.current = () => {
      if (isRunning) {
        announce(
          'Un backtest est déjà en cours : arrête-le ou attends sa fin avant d’en lancer un autre.'
        );
      } else if (!canRun) {
        announce(blockReason?.message ?? 'Lancement indisponible.');
      } else {
        submit();
      }
    };
  }, [announce, blockReason, canRun, isRunning, submit]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === 'Enter' &&
        !event.repeat &&
        !event.isComposing &&
        !event.defaultPrevented &&
        !document.querySelector('dialog[open]')
      ) {
        event.preventDefault();
        shortcutRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCapital = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.trim();
    const parsed = Number(raw);
    update({ capital: raw === '' || !Number.isFinite(parsed) ? null : parsed });
  };

  const capitalError = fieldErrors.capital;
  const launchDisabled = isCancelling || (!isRunning && !canRun);
  const launchTooltip = isCancelling
    ? 'Annulation en cours…'
    : isRunning
      ? 'Arrêter le backtest en cours'
      : canRun
        ? `Lancer le backtest (${shortcut})`
        : (blockReason?.message ?? 'Lancement indisponible.');

  return (
    <div
      role="group"
      aria-label="Lancement du backtest"
      className="flex shrink-0 items-center gap-1 rounded-[14px] border border-line bg-sunken p-[5px] shadow-card"
    >
      <ComposerSelectToken
        label="Stratégie"
        chip="Py"
        chipClassName="bg-[linear-gradient(135deg,#8B5CF6,#6366F1)]"
        options={strategies.map((item) => ({
          value: item.id,
          label: item.name,
        }))}
        value={strategy?.id ?? null}
        onChange={(strategyId) => update({ strategyId })}
        emptyLabel="Aucune stratégie"
        missing={model.strategyMissing}
        meta={strategy ? `v${strategy.revision}` : undefined}
        disabled={isRunning}
      />
      <Separator />
      <ComposerSelectToken
        label="Données"
        chip={<Database size={12} strokeWidth={2.25} />}
        chipClassName="bg-[linear-gradient(135deg,#F59E0B,#EA580C)]"
        options={datasets.map((item) => ({
          value: item.id,
          label: formatDatasetLabel(item),
          group: item.source === 'public' ? 'Données publiques' : 'Mes données',
        }))}
        value={dataset?.id ?? null}
        onChange={(datasetId) => update({ datasetId })}
        emptyLabel="Aucune donnée prête"
        missing={model.datasetMissing}
        disabled={isRunning}
      />
      <Separator />
      <ComposerSelectToken
        label="Période"
        chip={<CalendarRange size={12} strokeWidth={2.25} />}
        chipClassName="bg-[linear-gradient(135deg,#0EA5E9,#2563EB)]"
        options={PERIOD_PRESETS.map((preset) => ({
          value: preset,
          label: PERIOD_LABELS[preset],
        }))}
        value={selection.periodPreset}
        onChange={(value) => {
          if (isPeriodPreset(value)) update({ periodPreset: value });
        }}
        emptyLabel="Tout"
        disabled={isRunning}
      />
      {selection.periodPreset === 'custom' ? (
        <span
          className={cn(
            TOKEN_CLASS,
            'gap-1 px-2',
            model.periodError && 'outline outline-1 outline-loss'
          )}
        >
          <input
            type="date"
            aria-label="Début de la période"
            aria-invalid={model.periodError ? true : undefined}
            aria-describedby={
              model.periodError ? RUN_COMPOSER_HINT_ID : undefined
            }
            value={selection.periodStart ?? ''}
            onChange={(event) =>
              update({ periodStart: event.target.value || null })
            }
            disabled={isRunning}
            className="w-[118px] border-0 bg-transparent p-0 font-mono text-[12px] text-inherit outline-none [color-scheme:inherit]"
          />
          <span aria-hidden="true" className={TOKEN_META_CLASS}>
            →
          </span>
          <input
            type="date"
            aria-label="Fin de la période (incluse)"
            aria-invalid={model.periodError ? true : undefined}
            aria-describedby={
              model.periodError ? RUN_COMPOSER_HINT_ID : undefined
            }
            value={selection.periodEnd ?? ''}
            onChange={(event) =>
              update({ periodEnd: event.target.value || null })
            }
            disabled={isRunning}
            className="w-[118px] border-0 bg-transparent p-0 font-mono text-[12px] text-inherit outline-none [color-scheme:inherit]"
          />
        </span>
      ) : null}
      <Separator />
      <label
        className={cn(
          TOKEN_CLASS,
          'pl-2.5',
          capitalError && 'outline outline-1 outline-loss'
        )}
      >
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          aria-label="Capital initial en USD"
          aria-invalid={capitalError ? true : undefined}
          aria-describedby={capitalError ? RUN_COMPOSER_HINT_ID : undefined}
          value={selection.capital ?? ''}
          onChange={handleCapital}
          disabled={isRunning}
          className="w-[92px] appearance-none border-0 bg-transparent p-0 text-right font-mono font-medium tabular-nums text-inherit outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span aria-hidden="true" className={TOKEN_META_CLASS}>
          USD
        </span>
      </label>
      <Tooltip content="Paramètres, frais, glissement et chauffe">
        {(triggerProps) => (
          <IconButton
            {...triggerProps}
            icon={<SlidersHorizontal size={16} />}
            label="Réglages avancés"
            count={advancedChanges}
            aria-haspopup="dialog"
            onClick={() => setAdvancedOpen(true)}
          />
        )}
      </Tooltip>
      <Tooltip content={launchTooltip}>
        {(triggerProps) => (
          <Button
            {...triggerProps}
            variant={isRunning ? 'danger' : 'primary'}
            aria-disabled={launchDisabled || undefined}
            aria-describedby={
              [
                triggerProps['aria-describedby'],
                !isRunning && !canRun ? RUN_COMPOSER_HINT_ID : undefined,
              ]
                .filter(Boolean)
                .join(' ') || undefined
            }
            aria-keyshortcuts={
              isRunning ? undefined : 'Control+Enter Meta+Enter'
            }
            leadingIcon={
              isRunning ? (
                <Square size={13} fill="currentColor" />
              ) : (
                <Play size={14} fill="currentColor" />
              )
            }
            trailing={
              isRunning ? undefined : <Kbd className="ml-0.5">{shortcut}</Kbd>
            }
            onClick={() => {
              if (isCancelling) return;
              if (isRunning) stop();
              else if (canRun) submit();
            }}
            className="h-9 min-w-[112px] px-4"
          >
            {isCancelling ? 'Arrêt…' : isRunning ? 'Arrêter' : 'Lancer'}
          </Button>
        )}
      </Tooltip>
      <AdvancedSettingsDrawer
        open={advancedOpen}
        onClose={() => setAdvancedOpen(false)}
        model={model}
      />
    </div>
  );
}
