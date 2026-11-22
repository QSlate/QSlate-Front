'use client';

import { Database, Play, SlidersHorizontal, Square } from 'lucide-react';
import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { formatCandleCount } from '@/entities/dataset';
import { cn } from '@/shared/lib/class-names';
import { Button, IconButton, Kbd, Tooltip } from '@/shared/ui';

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
    update,
    submit,
    stop,
  } = model;
  const shortcut = useSyncExternalStore(
    subscribePlatform,
    getPlatformShortcut,
    getServerShortcut
  );

  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

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
        submitRef.current();
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

  return (
    <div
      role="group"
      aria-label="Lancement du backtest"
      className="flex items-center gap-1 rounded-[14px] border border-line bg-sunken p-[5px] shadow-card"
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
          label: item.symbol ? `${item.name} · ${item.symbol}` : item.name,
        }))}
        value={dataset?.id ?? null}
        onChange={(datasetId) => update({ datasetId })}
        emptyLabel="Aucune donnée prête"
        meta={dataset ? formatCandleCount(dataset.row_count) : undefined}
        disabled={isRunning}
      />
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
      {isRunning ? (
        <Button
          variant="danger"
          leadingIcon={<Square size={13} fill="currentColor" />}
          onClick={stop}
          className="h-9 px-4"
        >
          Arrêter
        </Button>
      ) : canRun ? (
        <Button
          variant="primary"
          leadingIcon={<Play size={14} fill="currentColor" />}
          trailing={<Kbd className="ml-0.5">{shortcut}</Kbd>}
          aria-keyshortcuts="Control+Enter Meta+Enter"
          onClick={submit}
          className="h-9 px-4"
        >
          Lancer
        </Button>
      ) : (
        <Tooltip
          content={blockReason?.message ?? 'Lancement indisponible.'}
          side="bottom"
        >
          {(triggerProps) => (
            <Button
              {...triggerProps}
              variant="primary"
              aria-disabled="true"
              leadingIcon={<Play size={14} fill="currentColor" />}
              trailing={<Kbd className="ml-0.5">{shortcut}</Kbd>}
              className="h-9 px-4"
            >
              Lancer
            </Button>
          )}
        </Tooltip>
      )}
      <AdvancedSettingsDrawer
        open={advancedOpen}
        onClose={() => setAdvancedOpen(false)}
        model={model}
      />
    </div>
  );
}
