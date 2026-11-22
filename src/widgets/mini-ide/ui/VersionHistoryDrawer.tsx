'use client';

import { History, RotateCcw } from 'lucide-react';

import type { StrategyVersion } from '@/shared/api';
import { Badge, Button, Drawer, IconTile, Skeleton } from '@/shared/ui';

export interface VersionHistoryDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly versions: readonly StrategyVersion[];
  readonly currentVersionId: string | null;
  readonly strategyName: string;
  readonly isLoading: boolean;
  readonly onRestore: (version: StrategyVersion) => void;
  readonly isRestoring?: boolean | undefined;
}

const DATE = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Saved revisions of a strategy, newest first, with restore. */
export function VersionHistoryDrawer({
  isOpen,
  onClose,
  versions,
  currentVersionId,
  strategyName,
  isLoading,
  onRestore,
  isRestoring = false,
}: VersionHistoryDrawerProps) {
  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title="Historique des versions"
      description={strategyName}
      icon={<IconTile icon={<History />} tone="brand" />}
    >
      {isLoading ? (
        <Skeleton className="h-24" />
      ) : versions.length === 0 ? (
        <p className="m-0 text-xs text-fg-3">Aucune version enregistrée.</p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {versions.map((version) => {
            const current = version.version_id === currentVersionId;
            return (
              <li
                key={version.version_id}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[12.5px] font-semibold text-fg">
                      v{version.revision}
                    </span>
                    {current ? (
                      <Badge tone="gain" dot>
                        Active
                      </Badge>
                    ) : null}
                  </span>
                  <span className="font-mono text-[11px] text-fg-3">
                    {DATE.format(new Date(version.created_at))}
                  </span>
                  {version.restored_from ? (
                    <span className="text-[11px] text-fg-3">
                      Restaurée depuis une version antérieure
                    </span>
                  ) : null}
                </div>
                {current ? null : (
                  <Button
                    size="sm"
                    variant="secondary"
                    leadingIcon={<RotateCcw size={13} />}
                    disabled={isRestoring}
                    onClick={() => onRestore(version)}
                  >
                    Restaurer
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Drawer>
  );
}
