'use client';

import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { type ReactNode, useId } from 'react';

import {
  describeParameters,
  type ParameterField,
} from '@/features/compose-backtest';
import { cn } from '@/shared/lib/class-names';
import {
  Button,
  Drawer,
  IconTile,
  Input,
  NumberInput,
  Skeleton,
  Switch,
} from '@/shared/ui';

import type { RunComposerModel } from '../model/use-run-composer';

const CHANGED_FRAME =
  'border-brand-line bg-brand-soft shadow-[0_0_0_3px_var(--brand-soft)] hover:border-brand-line';

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 6,
});

function formatDefault(value: ParameterField['defaultValue']): string {
  if (typeof value === 'number') return NUMBER_FORMATTER.format(value);
  if (typeof value === 'boolean') return value ? 'activé' : 'désactivé';
  return value === '' ? '(vide)' : value;
}

function SectionTitle({ children }: { readonly children: ReactNode }) {
  return (
    <h3 className="m-0 flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em] text-fg-3 after:h-px after:flex-1 after:bg-line">
      {children}
    </h3>
  );
}

interface SettingRowProps {
  readonly label: ReactNode;
  readonly helper: ReactNode;
  readonly labelId: string;
  readonly helperId: string;
  readonly error?: string | undefined;
  readonly errorId?: string | undefined;
  readonly children: ReactNode;
}

function SettingRow({
  label,
  helper,
  labelId,
  helperId,
  error,
  errorId,
  children,
}: SettingRowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_140px] items-center gap-3">
      <div className="flex min-w-0 flex-col gap-px">
        <span id={labelId} className="text-[12.5px] font-medium text-fg">
          {label}
        </span>
        <span id={helperId} className="text-[11.5px] text-fg-3">
          {helper}
        </span>
      </div>
      {children}
      {error ? (
        <p id={errorId} className="col-span-2 m-0 text-[11.5px] text-loss">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface ParameterRowProps {
  readonly field: ParameterField;
  readonly value: ParameterField['defaultValue'] | undefined;
  readonly error?: string | undefined;
  readonly onChange: (value: ParameterField['defaultValue'] | null) => void;
}

function ParameterRow({ field, value, error, onChange }: ParameterRowProps) {
  const labelId = useId();
  const helperId = useId();
  const errorId = useId();
  const current = value ?? field.defaultValue;
  const changed = value !== undefined && value !== field.defaultValue;
  const commit = (next: ParameterField['defaultValue'] | null) =>
    onChange(next === null || next === field.defaultValue ? null : next);
  const described = error ? `${helperId} ${errorId}` : helperId;
  const bounded =
    field.kind === 'number' && field.min !== null && field.max !== null;

  let control: ReactNode;
  if (field.kind === 'boolean') {
    control = (
      <Switch
        aria-labelledby={labelId}
        aria-describedby={described}
        checked={current === true}
        onCheckedChange={commit}
        className="justify-self-end"
      />
    );
  } else if (field.kind === 'number') {
    control = (
      <NumberInput
        aria-labelledby={labelId}
        aria-describedby={described}
        aria-invalid={error ? true : undefined}
        value={typeof current === 'number' ? current : null}
        onValueChange={commit}
        step={field.integer ? 1 : 'any'}
        min={field.min ?? undefined}
        max={field.max ?? undefined}
        frameClassName={cn(changed && CHANGED_FRAME, error && 'border-loss')}
      />
    );
  } else {
    control = (
      <Input
        aria-labelledby={labelId}
        aria-describedby={described}
        value={typeof current === 'string' ? current : ''}
        onChange={(event) => commit(event.target.value)}
        mono
        frameClassName={cn(changed && CHANGED_FRAME)}
      />
    );
  }

  const defaultText = changed ? (
    <>
      Modifié · défaut{' '}
      <span className="font-mono">{formatDefault(field.defaultValue)}</span>
    </>
  ) : (
    <>
      Défaut{' '}
      <span className="font-mono">{formatDefault(field.defaultValue)}</span>
    </>
  );

  return (
    <SettingRow
      labelId={labelId}
      helperId={helperId}
      errorId={errorId}
      error={error}
      label={
        <>
          {field.label}{' '}
          <span className="font-mono text-[10.5px] font-normal text-fg-3">
            {field.key}
          </span>
        </>
      }
      helper={
        <>
          {field.description ? <>{field.description} · </> : null}
          {defaultText}
          {bounded ? (
            <>
              {' · '}
              <span className="font-mono">
                {formatDefault(field.min ?? 0)}–{formatDefault(field.max ?? 0)}
              </span>
            </>
          ) : null}
        </>
      }
    >
      {control}
      {bounded && typeof current === 'number' ? (
        <input
          type="range"
          aria-label={`${field.label} (curseur)`}
          min={field.min ?? undefined}
          max={field.max ?? undefined}
          step={field.integer ? 1 : 'any'}
          value={current}
          onChange={(event) => commit(Number(event.target.value))}
          className="col-span-2 h-1 w-full cursor-pointer accent-[var(--a1)]"
        />
      ) : null}
    </SettingRow>
  );
}

interface CostRowProps {
  readonly label: string;
  readonly helper: string;
  readonly suffix: string;
  readonly value: number | null;
  readonly defaultValue: number;
  readonly step: number;
  readonly error: string | undefined;
  readonly onChange: (value: number | null) => void;
}

function CostRow({
  label,
  helper,
  suffix,
  value,
  defaultValue,
  step,
  error,
  onChange,
}: CostRowProps) {
  const labelId = useId();
  const helperId = useId();
  const errorId = useId();
  return (
    <SettingRow
      label={label}
      helper={helper}
      labelId={labelId}
      helperId={helperId}
      error={error}
      errorId={errorId}
    >
      <NumberInput
        aria-labelledby={labelId}
        aria-describedby={error ? `${helperId} ${errorId}` : helperId}
        value={value}
        onValueChange={onChange}
        step={step}
        min={0}
        suffix={suffix}
        invalid={Boolean(error)}
        frameClassName={cn(value !== defaultValue && !error && CHANGED_FRAME)}
      />
    </SettingRow>
  );
}

interface AdvancedSettingsDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly model: RunComposerModel;
}

/** "Réglages avancés": strategy parameters, market costs and warm-up. */
export function AdvancedSettingsDrawer({
  open,
  onClose,
  model,
}: AdvancedSettingsDrawerProps) {
  const {
    strategy,
    strategyDefaults,
    parameterSchema,
    parameterErrors,
    selection,
    fieldErrors,
    advancedChanges,
    update,
    setParameter,
    resetAdvanced,
  } = model;
  const fields = strategyDefaults
    ? describeParameters(strategyDefaults, parameterSchema)
    : [];
  const overrides = strategy
    ? (selection.parameterOverrides[strategy.id] ?? {})
    : {};

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Réglages avancés"
      description="Appliqués au prochain lancement."
      icon={<IconTile icon={<SlidersHorizontal />} tone="brand" />}
      footer={
        <>
          <Button
            variant="quiet"
            leadingIcon={<RotateCcw size={14} />}
            onClick={resetAdvanced}
            disabled={advancedChanges === 0}
          >
            Réinitialiser
          </Button>
          <Button variant="primary" onClick={onClose}>
            Terminé
          </Button>
        </>
      }
    >
      <section className="flex flex-col gap-3.5" aria-label="Paramètres">
        <SectionTitle>
          {strategy ? `Paramètres de ${strategy.name}` : 'Paramètres'}
        </SectionTitle>
        {!strategy ? (
          <p className="m-0 text-xs text-fg-3">
            Choisis une stratégie pour régler ses paramètres.
          </p>
        ) : strategyDefaults === null ? (
          <div aria-hidden="true" className="flex flex-col gap-2.5">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        ) : fields.length === 0 ? (
          <p className="m-0 text-xs text-fg-3">
            Cette stratégie n&apos;expose aucun paramètre réglable.
          </p>
        ) : (
          fields.map((field) => (
            <ParameterRow
              key={field.key}
              field={field}
              value={overrides[field.key]}
              error={parameterErrors[field.key]}
              onChange={(value) => setParameter(field.key, value)}
            />
          ))
        )}
      </section>
      <section className="flex flex-col gap-3.5" aria-label="Coûts de marché">
        <SectionTitle>Coûts de marché</SectionTitle>
        <CostRow
          label="Frais par trade"
          helper="Prélevés à l'ouverture et à la fermeture de chaque position."
          suffix="%"
          value={selection.commissionPercent}
          defaultValue={0}
          step={0.01}
          error={fieldErrors.commissionPercent}
          onChange={(commissionPercent) => update({ commissionPercent })}
        />
        <CostRow
          label="Glissement de prix"
          helper="Écart défavorable sur le prix d'exécution (1 pb = 0,01 %)."
          suffix="pb"
          value={selection.slippageBps}
          defaultValue={0}
          step={1}
          error={fieldErrors.slippageBps}
          onChange={(slippageBps) => update({ slippageBps })}
        />
      </section>
      <section className="flex flex-col gap-3.5" aria-label="Démarrage">
        <SectionTitle>Démarrage</SectionTitle>
        <CostRow
          label="Historique de chauffe"
          helper="Bougies lues avant le premier signal pour initialiser les indicateurs."
          suffix="bougies"
          value={selection.window}
          defaultValue={20}
          step={1}
          error={fieldErrors.window}
          onChange={(window) => update({ window })}
        />
      </section>
    </Drawer>
  );
}
