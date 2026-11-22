'use client';

import { Database, FolderOpen } from 'lucide-react';

import { useLabStore } from '@/features/lab-state';
import { Button, EmptyState } from '@/shared/ui';

/**
 * Entry point of the "Données" section. The guided market-data import is
 * delivered in a later step; meanwhile the existing custom datasets drawer
 * (backed by the dataset API) stays reachable from here.
 */
export function DatasetsView() {
  const openDatasets = useLabStore(
    (state) => state.setCustomDatasetsDrawerOpen
  );

  return (
    <section
      aria-label="Données de marché"
      className="flex flex-1 items-center justify-center px-[22px] py-10"
    >
      <EmptyState
        icon={<Database />}
        title="L'import guidé de données arrive bientôt"
        description="Tu pourras importer un fichier CSV ou Parquet de bougies et ses colonnes seront reconnues automatiquement. En attendant, tes jeux de données personnalisés restent accessibles."
        action={
          <Button
            leadingIcon={<FolderOpen size={15} />}
            onClick={() => openDatasets(true)}
          >
            Gérer mes jeux de données
          </Button>
        }
      />
    </section>
  );
}
