'use client';

import {
  CheckCircle2,
  FileUp,
  LoaderCircle,
  TriangleAlert,
} from 'lucide-react';
import { type ChangeEvent, useEffect, useId, useRef, useState } from 'react';

import { useInvalidateDatasets } from '@/entities/dataset';
import { apiClient, type CustomDataset } from '@/shared/api';
import { cn } from '@/shared/lib/class-names';
import { Button, Dialog, Input, Select } from '@/shared/ui';

import {
  type ColumnMappingDraft,
  detectColumnMapping,
  FIELD_LABELS,
  MAPPED_FIELDS,
  type MappedField,
  missingFields,
  TIMESTAMP_UNIT_LABELS,
  TIMESTAMP_UNITS,
  type TimestampUnit,
} from '../model/column-detection';

type Step = 'file' | 'columns' | 'check';

const STEPS: readonly { readonly id: Step; readonly label: string }[] = [
  { id: 'file', label: 'Fichier' },
  { id: 'columns', label: 'Colonnes' },
  { id: 'check', label: 'Vérification' },
];

const POLL_MS = 1_500;
const MAX_POLLS = 120;
const NONE = '__none__';

function describeError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message
    ? `${fallback} (${error.message})`
    : fallback;
}

function idempotencyKey(): string {
  return `import-${crypto.randomUUID()}`;
}

interface ImportDatasetDialogProps {
  readonly onClose: () => void;
  /** Called once the dataset is ready for backtests. */
  readonly onReady?: ((dataset: CustomDataset) => void) | undefined;
}

/** Guided import: Fichier → Colonnes (auto-detected) → Vérification. */
export function ImportDatasetDialog({
  onClose,
  onReady,
}: ImportDatasetDialogProps) {
  const invalidate = useInvalidateDatasets();
  const formId = useId();
  const [step, setStep] = useState<Step>('file');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dataset, setDataset] = useState<CustomDataset | null>(null);
  const [mapping, setMapping] = useState<ColumnMappingDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CustomDataset | null>(null);
  /** Set on unmount so a running poll stops quietly. */
  const closedRef = useRef(false);
  useEffect(() => {
    closedRef.current = false;
    return () => {
      closedRef.current = true;
    };
  }, []);

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
    setFile(next);
    if (next && name.trim() === '')
      setName(next.name.replace(/\.(csv|parquet)$/i, ''));
  };

  const upload = async () => {
    if (!file || name.trim() === '') return;
    setBusy(true);
    setError(null);
    try {
      const uploaded = await apiClient.uploadCustomDataset(file, name.trim());
      setDataset(uploaded);
      setMapping(detectColumnMapping(uploaded.columns, uploaded.preview ?? []));
      setStep('columns');
      void invalidate();
    } catch (cause) {
      setError(describeError(cause, "L'envoi du fichier a échoué."));
    } finally {
      setBusy(false);
    }
  };

  const validate = async () => {
    if (!dataset || !mapping) return;
    const { timestamp, open, high, low, close, volume } = mapping.fields;
    if (!timestamp || !open || !high || !low || !close) return;
    setBusy(true);
    setError(null);
    setStep('check');
    try {
      const mapped = await apiClient.mapDatasetColumns(dataset.id, {
        base_version_id: dataset.version_id,
        timestamp_column: timestamp,
        timezone: 'UTC',
        timestamp_unit: mapping.unit,
        columns: { open, high, low, close, ...(volume ? { volume } : {}) },
      });
      setDataset(mapped);
      await apiClient.validateDataset(mapped.id, idempotencyKey());
      for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, POLL_MS));
        if (closedRef.current) return;
        const current = await apiClient.getCustomDataset(mapped.id);
        if (current.status === 'ready') {
          setResult(current);
          void invalidate();
          onReady?.(current);
          return;
        }
        if (current.status === 'failed') {
          setError(current.error || 'Le fichier ne passe pas la vérification.');
          void invalidate();
          return;
        }
      }
      setError(
        'La vérification prend plus de temps que prévu. Le statut se mettra à jour dans la page Données.'
      );
    } catch (cause) {
      setError(describeError(cause, 'La vérification a échoué.'));
    } finally {
      setBusy(false);
    }
  };

  const missing = mapping ? missingFields(mapping) : [];
  const columns = dataset?.columns ?? [];
  const preview = (dataset?.preview ?? []).slice(0, 5);

  const setField = (field: MappedField, column: string) =>
    setMapping((current) =>
      current
        ? {
            ...current,
            fields: {
              ...current.fields,
              [field]: column === NONE ? null : column,
            },
          }
        : current
    );

  let footer;
  if (step === 'file') {
    footer = (
      <>
        <Button variant="quiet" onClick={onClose}>
          Annuler
        </Button>
        <Button
          type="submit"
          form={formId}
          disabled={!file || name.trim() === '' || busy}
        >
          {busy ? 'Envoi…' : 'Continuer'}
        </Button>
      </>
    );
  } else if (step === 'columns') {
    footer = (
      <>
        <Button variant="quiet" onClick={onClose}>
          Plus tard
        </Button>
        <Button
          onClick={() => void validate()}
          disabled={missing.length > 0 || busy}
        >
          Vérifier les données
        </Button>
      </>
    );
  } else {
    footer = (
      <>
        {error ? (
          <Button
            variant="quiet"
            onClick={() => setStep('columns')}
            disabled={busy}
          >
            Revoir les colonnes
          </Button>
        ) : null}
        <Button onClick={onClose} disabled={busy}>
          {result ? 'Terminé' : 'Fermer'}
        </Button>
      </>
    );
  }

  return (
    <Dialog
      title="Importer des données de marché"
      description="Un fichier CSV ou Parquet de bougies : date, ouverture, plus haut, plus bas, clôture et volume."
      onClose={onClose}
      footer={footer}
      className="w-[min(640px,calc(100vw-32px))]"
    >
      <ol
        aria-label="Étapes de l'import"
        className="m-0 mb-4 flex list-none gap-2 p-0"
      >
        {STEPS.map((item, index) => {
          const current = item.id === step;
          const done =
            STEPS.findIndex((candidate) => candidate.id === step) > index;
          return (
            <li
              key={item.id}
              aria-current={current ? 'step' : undefined}
              className={cn(
                'flex flex-1 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
                current
                  ? 'border-brand-line bg-brand-soft text-fg'
                  : 'border-line text-fg-3'
              )}
            >
              <span
                className={cn(
                  'grid size-5 place-items-center rounded-full font-mono text-[10.5px]',
                  done ? 'bg-gain-soft text-gain' : 'bg-sunken'
                )}
              >
                {done ? '✓' : index + 1}
              </span>
              {item.label}
            </li>
          );
        })}
      </ol>

      {step === 'file' ? (
        <form
          id={formId}
          onSubmit={(event) => {
            event.preventDefault();
            void upload();
          }}
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-fg">
            Fichier
            <span className="relative flex items-center gap-2 rounded-xl border border-dashed border-line-strong bg-sunken px-3 py-4 text-fg-2">
              <FileUp size={16} aria-hidden="true" />
              <span className="truncate font-mono text-xs">
                {file ? file.name : 'Choisir un fichier .csv ou .parquet'}
              </span>
              <input
                type="file"
                accept=".csv,.parquet"
                onChange={onFile}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-fg">
            Nom du jeu de données
            <Input
              value={name}
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        </form>
      ) : null}

      {step === 'columns' && mapping ? (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-xs text-fg-3">
            Colonnes reconnues automatiquement. Corrige-les si besoin.
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {MAPPED_FIELDS.map((field) => (
              <label
                key={field}
                className="flex flex-col gap-1 text-xs font-medium text-fg-2"
              >
                {FIELD_LABELS[field]}
                <Select
                  value={mapping.fields[field] ?? NONE}
                  invalid={field !== 'volume' && mapping.fields[field] === null}
                  options={[
                    {
                      value: NONE,
                      label: field === 'volume' ? 'Aucune' : 'À choisir',
                    },
                    ...columns.map((column) => ({
                      value: column,
                      label: column,
                    })),
                  ]}
                  onValueChange={(column) => setField(field, column)}
                />
              </label>
            ))}
            <label className="flex flex-col gap-1 text-xs font-medium text-fg-2">
              Format de la date
              <Select<TimestampUnit>
                value={mapping.unit}
                options={TIMESTAMP_UNITS.map((unit) => ({
                  value: unit,
                  label: TIMESTAMP_UNIT_LABELS[unit],
                }))}
                onValueChange={(unit) => setMapping({ ...mapping, unit })}
              />
            </label>
          </div>
          {preview.length > 0 ? (
            <div className="overflow-auto rounded-lg border border-line">
              <table className="w-full border-collapse font-mono text-[11px]">
                <caption className="sr-only">
                  Aperçu des premières lignes
                </caption>
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        scope="col"
                        className="whitespace-nowrap border-b border-line bg-sunken px-2 py-1.5 text-left font-medium text-fg-3"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="whitespace-nowrap border-b border-[var(--line-2)] px-2 py-1 text-fg-2"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {missing.length > 0 ? (
            <p role="alert" className="m-0 text-xs text-loss">
              Colonnes à choisir :{' '}
              {missing.map((field) => FIELD_LABELS[field]).join(', ')}.
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 'check' ? (
        <div
          role="status"
          className="flex flex-col items-center gap-2 py-6 text-center"
        >
          {busy ? (
            <>
              <LoaderCircle
                size={22}
                className="animate-spin text-brand motion-reduce:animate-none"
                aria-hidden="true"
              />
              <b className="text-[13px] text-fg">Vérification et indexation…</b>
              <span className="text-xs text-fg-3">
                Chaque bougie est contrôlée (dates, prix positifs, haut ≥ bas).
              </span>
            </>
          ) : result ? (
            <>
              <CheckCircle2
                size={22}
                className="text-gain"
                aria-hidden="true"
              />
              <b className="text-[13px] text-fg">« {result.name} » est prêt</b>
              <span className="font-mono text-xs text-fg-3">
                {new Intl.NumberFormat('fr-FR').format(result.row_count)}{' '}
                bougies · disponible dans « Mes données »
              </span>
            </>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="m-0 mt-2 flex items-start gap-2 rounded-lg border border-loss/40 bg-loss-soft px-3 py-2 text-xs text-loss"
        >
          <TriangleAlert
            size={14}
            aria-hidden="true"
            className="mt-px shrink-0"
          />
          {error}
        </p>
      ) : null}
    </Dialog>
  );
}
