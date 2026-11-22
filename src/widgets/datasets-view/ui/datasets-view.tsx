'use client';

import { Database, Globe, Trash2, Upload } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import {
  formatCandleCount,
  formatDatasetLabel,
  useDatasets,
  useInvalidateDatasets,
  useRunDatasets,
} from '@/entities/dataset';
import { ImportDatasetDialog } from '@/features/import-dataset';
import { useLabStore } from '@/features/lab-state';
import {
  apiClient,
  type CustomDataset,
  type CustomDatasetStatus,
} from '@/shared/api';
import {
  Badge,
  type BadgeTone,
  Button,
  Dialog,
  EmptyState,
  IconButton,
  Skeleton,
} from '@/shared/ui';

const STATUS: Readonly<
  Record<
    CustomDatasetStatus,
    { readonly label: string; readonly tone: BadgeTone }
  >
> = {
  uploaded: { label: 'Colonnes à associer', tone: 'warn' },
  mapped: { label: 'À vérifier', tone: 'warn' },
  validating: { label: 'Vérification…', tone: 'brand' },
  ready: { label: 'Prêt', tone: 'gain' },
  failed: { label: 'Échec', tone: 'loss' },
};

function statusOf(status: CustomDatasetStatus) {
  return STATUS[status] ?? STATUS.validating;
}

const DATE = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function SectionTitle({
  icon,
  children,
}: {
  readonly icon: ReactNode;
  readonly children: string;
}) {
  return (
    <h2 className="m-0 flex items-center gap-2 text-[13px] font-semibold text-fg [&_svg]:size-4 [&_svg]:text-fg-3">
      {icon}
      {children}
    </h2>
  );
}

/** "Données": public catalogue and the user's own datasets with status. */
export function DatasetsView() {
  const runDatasets = useRunDatasets();
  const own = useDatasets();
  const invalidate = useInvalidateDatasets();
  const showToast = useLabStore((state) => state.showToast);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState<CustomDataset | null>(null);
  const [pending, setPending] = useState(false);

  const publicDatasets = (runDatasets.data ?? []).filter(
    (item) => item.source === 'public'
  );
  const mine = own.data ?? [];

  const remove = async (dataset: CustomDataset) => {
    setPending(true);
    try {
      await apiClient.deleteCustomDataset(dataset.id);
      await invalidate();
      showToast(`« ${dataset.name} » supprimé`, 'success');
      setDeleting(null);
    } catch {
      showToast('Impossible de supprimer ce jeu de données.', 'error');
    } finally {
      setPending(false);
    }
  };

  return (
    <section
      aria-label="Données de marché"
      className="flex flex-col gap-6 px-[22px] py-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 max-w-[620px] text-[12.5px] text-fg-3">
          Les données publiques sont prêtes à l&apos;emploi. Importe tes propres
          bougies (CSV ou Parquet) pour tester sur d&apos;autres marchés.
        </p>
        <Button
          leadingIcon={<Upload size={15} />}
          onClick={() => setImporting(true)}
        >
          Importer un fichier
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <SectionTitle icon={<Globe />}>Données publiques</SectionTitle>
        {runDatasets.isPending ? (
          <Skeleton className="h-24" />
        ) : publicDatasets.length === 0 ? (
          <p className="m-0 text-xs text-fg-3">
            Aucun jeu de données public n&apos;est disponible.
          </p>
        ) : (
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5 p-0">
            {publicDatasets.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-3 shadow-card"
              >
                <span className="font-mono text-[13px] font-semibold text-fg">
                  {formatDatasetLabel(item)}
                </span>
                <span className="truncate text-[11.5px] text-fg-3">
                  {item.name}
                </span>
                <Badge tone="gain" dot className="mt-1 self-start">
                  Prêt
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <SectionTitle icon={<Database />}>Mes données</SectionTitle>
        {own.isPending ? (
          <Skeleton className="h-24" />
        ) : own.isError ? (
          <p role="alert" className="m-0 text-xs text-loss">
            Impossible de charger tes jeux de données.
          </p>
        ) : mine.length === 0 ? (
          <EmptyState
            icon={<Upload />}
            title="Aucun fichier importé"
            description="Les colonnes date, ouverture, plus haut, plus bas, clôture et volume sont reconnues automatiquement."
            action={
              <Button variant="secondary" onClick={() => setImporting(true)}>
                Importer un fichier
              </Button>
            }
          />
        ) : (
          <div className="overflow-auto rounded-xl border border-line bg-surface shadow-card">
            <table className="w-full border-collapse text-[12.5px]">
              <caption className="sr-only">Mes jeux de données</caption>
              <thead>
                <tr className="text-left text-[11px] text-fg-3">
                  {['Nom', 'Format', 'Bougies', 'Statut', 'Importé le', ''].map(
                    (header) => (
                      <th
                        key={header || 'actions'}
                        scope="col"
                        className="border-b border-line px-3 py-2 font-medium"
                      >
                        {header || <span className="sr-only">Actions</span>}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {mine.map((item) => {
                  const status = statusOf(item.status);
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-[var(--line-2)] last:border-0"
                    >
                      <td className="px-3 py-2 font-medium text-fg">
                        {item.name}
                      </td>
                      <td className="px-3 py-2 font-mono uppercase text-fg-3">
                        {item.format}
                      </td>
                      <td className="px-3 py-2 font-mono text-fg-2">
                        {item.row_count > 0
                          ? formatCandleCount(item.row_count)
                          : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <Badge tone={status.tone} dot>
                          {status.label}
                        </Badge>
                        {item.status === 'failed' && item.error ? (
                          <span
                            className="mt-1 block max-w-[280px] truncate text-[11px] text-loss"
                            title={item.error}
                          >
                            {item.error}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 font-mono text-fg-3">
                        {item.created_at
                          ? DATE.format(new Date(item.created_at))
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <IconButton
                          icon={<Trash2 size={14} />}
                          label={`Supprimer ${item.name}`}
                          size="sm"
                          onClick={() => setDeleting(item)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {importing ? (
        <ImportDatasetDialog onClose={() => setImporting(false)} />
      ) : null}
      {deleting ? (
        <Dialog
          title="Supprimer ce jeu de données ?"
          description={`« ${deleting.name} » et toutes ses versions seront supprimés définitivement. Les backtests déjà lancés gardent leur copie.`}
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button variant="quiet" onClick={() => setDeleting(null)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                disabled={pending}
                onClick={() => void remove(deleting)}
              >
                {pending ? 'Suppression…' : 'Supprimer'}
              </Button>
            </>
          }
        >
          {null}
        </Dialog>
      ) : null}
    </section>
  );
}
