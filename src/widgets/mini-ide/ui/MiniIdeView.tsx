'use client';

import {
  CircleAlert,
  CircleCheck,
  FilePlus2,
  History,
  LoaderCircle,
  Save,
  Upload,
} from 'lucide-react';
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

import {
  useInvalidateStrategies,
  useStrategies,
  useStrategy,
} from '@/entities/strategy';
import { useLabStore } from '@/features/lab-state';
import { apiClient, type Diagnostic, type StrategyVersion } from '@/shared/api';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';
import { useAppearance } from '@/shared/theme';
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  Input,
  Skeleton,
} from '@/shared/ui';

import {
  type DiagnosticMarker,
  MonacoEditorWrapper,
} from './MonacoEditorWrapper';
import { VersionHistoryDrawer } from './VersionHistoryDrawer';

/** Minimal starting point for a new strategy (no trading logic). */
const NEW_STRATEGY_SOURCE = `from qslate import Strategy


class MyStrategy(Strategy):
    """Décris ici l'idée de ta stratégie."""

    def on_bar(self, bar):
        pass
`;

const LINT_DELAY_MS = 400;

function toMarkers(diagnostics: readonly Diagnostic[]): DiagnosticMarker[] {
  return diagnostics.map((item) => ({
    line: item.line,
    column: item.column,
    endLine: item.end_line,
    endColumn: item.end_column,
    severity: item.severity,
    message: item.message,
  }));
}

type Selection =
  | { readonly kind: 'existing'; readonly id: string }
  | { readonly kind: 'new' }
  | null;

/** "Stratégies": the user's strategies, a Python editor, lint, save and history. */
export function MiniIdeView() {
  const { theme } = useAppearance();
  const showToast = useLabStore((state) => state.showToast);
  const strategies = useStrategies();
  const invalidate = useInvalidateStrategies();
  const [selection, setSelection] = useState<Selection>(null);
  const [pendingSelection, setPendingSelection] = useState<Selection>(null);
  const list = strategies.data ?? [];
  const current: Selection =
    selection ?? (list[0] ? { kind: 'existing', id: list[0].id } : null);
  const selectedId = current?.kind === 'existing' ? current.id : null;
  const detail = useStrategy(selectedId);
  const [draft, setDraft] = useState<{
    readonly source: string;
    readonly name: string;
    readonly for: string;
  } | null>(null);
  const [diagnostics, setDiagnostics] = useState<readonly Diagnostic[]>([]);
  const [linting, setLinting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<readonly StrategyVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentKey =
    current?.kind === 'existing'
      ? current.id
      : current?.kind === 'new'
        ? 'new'
        : '';
  const loaded =
    detail.data && detail.data.id === selectedId ? detail.data : null;
  const readOnly = loaded?.read_only === true;

  const source =
    draft && draft.for === currentKey
      ? draft.source
      : current?.kind === 'new'
        ? NEW_STRATEGY_SOURCE
        : (loaded?.source ?? '');
  const name =
    draft && draft.for === currentKey
      ? draft.name
      : current?.kind === 'new'
        ? 'MaStrategie'
        : (loaded?.name ?? '');
  const dirty = draft !== null && draft.for === currentKey;

  useEffect(() => {
    if (source.trim() === '') return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLinting(true);
      apiClient
        .lintStrategy(source, 'python')
        .then((result) => {
          if (active)
            setDiagnostics(result.valid ? [] : (result.diagnostics ?? []));
        })
        .catch(() => {
          if (active) setDiagnostics([]);
        })
        .finally(() => {
          if (active) setLinting(false);
        });
    }, LINT_DELAY_MS);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [source]);

  const markers = useMemo(() => toMarkers(diagnostics), [diagnostics]);
  const errors = diagnostics.filter((item) => item.severity === 'error').length;

  const edit = (patch: { readonly source?: string; readonly name?: string }) =>
    setDraft({
      source: patch.source ?? source,
      name: patch.name ?? name,
      for: currentKey,
    });

  const applySelection = (next: Selection) => {
    setDraft(null);
    setDiagnostics([]);
    setSelection(next);
    setPendingSelection(null);
  };

  const select = (next: Selection) => {
    if (dirty) setPendingSelection(next);
    else applySelection(next);
  };

  const save = async () => {
    if (saving || name.trim() === '') return;
    setSaving(true);
    try {
      const saved =
        current?.kind === 'existing' && loaded
          ? await apiClient.updateStrategy(loaded.id, {
              base_version_id: loaded.version_id,
              source,
              name: name.trim(),
            })
          : await apiClient.createStrategy({ name: name.trim(), source });
      await invalidate();
      setDraft(null);
      setSelection({ kind: 'existing', id: saved.id });
      showToast(
        `« ${saved.name} » enregistrée (v${saved.revision})`,
        'success'
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? `Enregistrement impossible : ${error.message}`
          : 'Enregistrement impossible.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const openHistory = async () => {
    if (!loaded) return;
    setHistoryOpen(true);
    setLoadingVersions(true);
    try {
      setVersions((await apiClient.getStrategyVersions(loaded.id)).items ?? []);
    } catch {
      showToast("Impossible de charger l'historique.", 'error');
    } finally {
      setLoadingVersions(false);
    }
  };

  const restore = async (version: StrategyVersion) => {
    if (!loaded || restoring) return;
    setRestoring(true);
    try {
      const restored = await apiClient.restoreStrategyVersion(loaded.id, {
        version_id: version.version_id,
        base_version_id: loaded.version_id,
      });
      await invalidate();
      setDraft(null);
      setVersions((await apiClient.getStrategyVersions(loaded.id)).items ?? []);
      showToast(
        `Version v${version.revision} restaurée (v${restored.revision})`,
        'success'
      );
    } catch {
      showToast('Restauration impossible.', 'error');
    } finally {
      setRestoring(false);
    }
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = await apiClient.importStrategy(file);
      await invalidate();
      setDraft(null);
      setSelection({ kind: 'existing', id: imported.id });
      showToast(`« ${imported.name} » importée`, 'success');
    } catch {
      showToast(
        'Import impossible : seul un fichier .py valide est accepté.',
        'error'
      );
    }
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)] max-md:grid-cols-1">
      <nav
        aria-label="Mes stratégies"
        className="flex min-h-0 flex-col gap-2 border-r border-line p-3 max-md:border-b max-md:border-r-0"
      >
        <div className="flex gap-1.5">
          <Button
            size="sm"
            leadingIcon={<FilePlus2 size={14} />}
            className="flex-1"
            onClick={() => select({ kind: 'new' })}
          >
            Nouvelle
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leadingIcon={<Upload size={14} />}
            onClick={() => fileRef.current?.click()}
          >
            Importer
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".py"
            className="hidden"
            aria-label="Importer un fichier Python"
            onChange={(event) => void importFile(event)}
          />
        </div>
        {strategies.isPending ? (
          <Skeleton className="h-24" />
        ) : list.length === 0 && current?.kind !== 'new' ? (
          <p className="m-0 p-2 text-xs text-fg-3">
            Aucune stratégie. Crée-en une ou importe un fichier .py.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-0.5 overflow-auto p-0">
            {current?.kind === 'new' ? (
              <li>
                <span
                  aria-current="true"
                  className="block rounded-lg bg-brand-soft px-2.5 py-2 text-[12.5px] font-medium text-fg"
                >
                  Nouvelle stratégie
                </span>
              </li>
            ) : null}
            {list.map((item) => {
              const active =
                current?.kind === 'existing' && current.id === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={active || undefined}
                    onClick={() => select({ kind: 'existing', id: item.id })}
                    className={cn(
                      FOCUS_RING,
                      'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px]',
                      active
                        ? 'bg-brand-soft font-medium text-fg'
                        : 'text-fg-2 hover:bg-[var(--line-2)]'
                    )}
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="font-mono text-[10.5px] text-fg-3">
                      v{item.revision}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="flex min-h-0 flex-col">
        {current === null && !strategies.isPending ? (
          <EmptyState
            icon={<FilePlus2 />}
            title="Commence ta première stratégie"
            description="Une stratégie est une classe Python qui décide d'acheter ou de vendre à chaque bougie."
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
              <label className="flex items-center gap-2">
                <span className="sr-only">Nom de la stratégie</span>
                <Input
                  value={name}
                  mono
                  disabled={readOnly}
                  onChange={(event) => edit({ name: event.target.value })}
                  frameClassName="w-[220px]"
                />
              </label>
              {loaded ? (
                <span className="font-mono text-[11px] text-fg-3">
                  v{loaded.revision}
                </span>
              ) : null}
              {readOnly ? (
                <Badge tone="vio">Marketplace · lecture seule</Badge>
              ) : null}
              {dirty ? (
                <Badge tone="warn" dot>
                  Non enregistré
                </Badge>
              ) : null}
              <span className="flex-1" />
              <span
                role="status"
                className="flex items-center gap-1.5 text-[11.5px] text-fg-3"
              >
                {linting ? (
                  <>
                    <LoaderCircle
                      size={13}
                      className="animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />{' '}
                    Analyse…
                  </>
                ) : errors > 0 ? (
                  <span className="flex items-center gap-1.5 text-loss">
                    <CircleAlert size={13} aria-hidden="true" /> {errors} erreur
                    {errors > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-gain">
                    <CircleCheck size={13} aria-hidden="true" /> Code valide
                  </span>
                )}
              </span>
              <Button
                size="sm"
                variant="secondary"
                leadingIcon={<History size={14} />}
                disabled={!loaded}
                onClick={() => void openHistory()}
              >
                Historique
              </Button>
              <Button
                size="sm"
                leadingIcon={<Save size={14} />}
                disabled={
                  readOnly ||
                  saving ||
                  name.trim() === '' ||
                  (!dirty && current?.kind !== 'new')
                }
                onClick={() => void save()}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              {current?.kind === 'existing' && !loaded ? (
                <div className="p-4">
                  <Skeleton className="h-64" />
                </div>
              ) : (
                <MonacoEditorWrapper
                  value={source}
                  language="python"
                  theme={theme}
                  markers={markers}
                  onChange={(value) => {
                    if (!readOnly) edit({ source: value });
                  }}
                />
              )}
            </div>
            {diagnostics.length > 0 ? (
              <ul
                aria-label="Problèmes détectés"
                className="m-0 max-h-32 list-none overflow-auto border-t border-line p-0 font-mono text-[11.5px]"
              >
                {diagnostics.map((item, index) => (
                  <li
                    key={index}
                    className={cn(
                      'px-3 py-1',
                      item.severity === 'error' ? 'text-loss' : 'text-warn'
                    )}
                  >
                    L{item.line}:{item.column} — {item.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>

      {pendingSelection ? (
        <Dialog
          title="Abandonner les modifications ?"
          description="Les changements non enregistrés de cette stratégie seront perdus."
          onClose={() => setPendingSelection(null)}
          footer={
            <>
              <Button variant="quiet" onClick={() => setPendingSelection(null)}>
                Continuer l&apos;édition
              </Button>
              <Button
                variant="danger"
                onClick={() => applySelection(pendingSelection)}
              >
                Abandonner
              </Button>
            </>
          }
        >
          {null}
        </Dialog>
      ) : null}
      <VersionHistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        versions={versions}
        currentVersionId={loaded?.version_id ?? null}
        strategyName={name}
        isLoading={loadingVersions}
        onRestore={(version) => void restore(version)}
        isRestoring={restoring}
      />
    </div>
  );
}
