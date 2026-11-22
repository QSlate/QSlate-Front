'use client';

import { Copy, Ellipsis, Pencil, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useEffect, useId, useRef, useState } from 'react';

import {
  DEFAULT_DASHBOARD_TITLE,
  useActiveDashboardId,
  useDashboardActions,
  useDashboards,
  useDashboardStore,
  useSavedDashboardLayouts,
} from '@/features/customize-lab';
import { useLabStore } from '@/features/lab-state';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';
import { Button, Dialog, IconButton, Input } from '@/shared/ui';

type DialogState =
  | { readonly kind: 'create' }
  | { readonly kind: 'rename'; readonly id: string; readonly title: string }
  | { readonly kind: 'delete'; readonly id: string; readonly title: string }
  | null;

const MAX_TITLE = 150;

interface TitleDialogProps {
  readonly heading: string;
  readonly initial: string;
  readonly submitLabel: string;
  readonly pending: boolean;
  readonly onSubmit: (title: string) => void;
  readonly onClose: () => void;
}

function TitleDialog({
  heading,
  initial,
  submitLabel,
  pending,
  onSubmit,
  onClose,
}: TitleDialogProps) {
  const [title, setTitle] = useState(initial);
  const formId = useId();
  const trimmed = title.trim();
  const error = trimmed === '' ? 'Donne un nom au dashboard.' : null;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!error && !pending) onSubmit(trimmed);
  };
  return (
    <Dialog
      title={heading}
      onClose={onClose}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={Boolean(error) || pending}
          >
            {pending ? 'Enregistrement…' : submitLabel}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-1.5">
        <label
          htmlFor={`${formId}-title`}
          className="text-[12.5px] font-medium text-fg"
        >
          Nom
        </label>
        <Input
          id={`${formId}-title`}
          value={title}
          maxLength={MAX_TITLE}
          autoFocus
          invalid={Boolean(error)}
          onChange={(event) => setTitle(event.target.value)}
        />
      </form>
    </Dialog>
  );
}

/**
 * Dashboard tabs: one per server dashboard (or a local "Mon dashboard"
 * before the first save), with create, rename, duplicate and delete.
 */
export function DashboardTabs() {
  const dashboards = useDashboards();
  const actions = useDashboardActions();
  const activeId = useActiveDashboardId();
  const setActive = useDashboardStore((state) => state.setActive);
  const editing = useDashboardStore((state) => state.draft !== null);
  const saveLayout = useDashboardStore((state) => state.saveLayout);
  const forgetLayout = useDashboardStore((state) => state.forgetLayout);
  const layouts = useSavedDashboardLayouts();
  const showToast = useLabStore((state) => state.showToast);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const items = dashboards.data ?? [];
  const active = items.find((item) => item.id === activeId) ?? items[0] ?? null;

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !(
              event.target instanceof Node &&
              menuRef.current?.contains(event.target)
            )
      ) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', close);
    };
  }, [menuOpen]);

  const failed = (message: string) => showToast(message, 'error');

  const create = (title: string) =>
    actions.create.mutate(title, {
      onSuccess: (created) => {
        setActive(created.id);
        setDialog(null);
      },
      onError: () => failed('Impossible de créer le dashboard.'),
    });

  const rename = (id: string, title: string) =>
    actions.rename.mutate(
      { id, title },
      {
        onSuccess: () => setDialog(null),
        onError: () => failed('Impossible de renommer le dashboard.'),
      }
    );

  const duplicate = (id: string) => {
    setMenuOpen(false);
    actions.duplicate.mutate(id, {
      onSuccess: (copy) => {
        const source = layouts[id];
        if (source) saveLayout(copy.id, source);
        setActive(copy.id);
      },
      onError: () => failed('Impossible de dupliquer le dashboard.'),
    });
  };

  const remove = (id: string) =>
    actions.remove.mutate(id, {
      onSuccess: () => {
        forgetLayout(id);
        setActive(items.find((item) => item.id !== id)?.id ?? null);
        setDialog(null);
      },
      onError: () => failed('Impossible de supprimer le dashboard.'),
    });

  const tabClass = (selected: boolean) =>
    cn(
      FOCUS_RING,
      'max-w-[180px] truncate rounded-lg px-2.5 py-[5px] text-xs font-medium',
      selected ? 'bg-surface text-fg shadow-card' : 'text-fg-3 hover:text-fg-2'
    );

  return (
    <div className="flex items-center gap-0.5">
      <div
        role="tablist"
        aria-label="Dashboards"
        className="flex items-center gap-0.5"
      >
        {items.length === 0 ? (
          <button
            type="button"
            role="tab"
            aria-selected="true"
            className={tabClass(true)}
          >
            {DEFAULT_DASHBOARD_TITLE}
          </button>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === active?.id}
              disabled={editing && item.id !== active?.id}
              onClick={() => setActive(item.id)}
              className={tabClass(item.id === active?.id)}
            >
              {item.title}
            </button>
          ))
        )}
      </div>
      {active ? (
        <div ref={menuRef} className="relative">
          <IconButton
            icon={<Ellipsis size={14} />}
            label={`Options de ${active.title}`}
            size="sm"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            disabled={editing}
            onClick={() => setMenuOpen((open) => !open)}
          />
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+6px)] z-20 flex min-w-[170px] flex-col rounded-xl border border-line-strong bg-raised p-1 shadow-pop"
            >
              {[
                {
                  label: 'Renommer',
                  icon: Pencil,
                  onSelect: () =>
                    setDialog({
                      kind: 'rename',
                      id: active.id,
                      title: active.title,
                    }),
                },
                {
                  label: 'Dupliquer',
                  icon: Copy,
                  onSelect: () => duplicate(active.id),
                },
                {
                  label: 'Supprimer',
                  icon: Trash2,
                  onSelect: () =>
                    setDialog({
                      kind: 'delete',
                      id: active.id,
                      title: active.title,
                    }),
                },
              ].map(({ label, icon: Icon, onSelect }) => (
                <button
                  key={label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onSelect();
                  }}
                  className={cn(
                    FOCUS_RING,
                    'flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-fg-2 hover:bg-[var(--line-2)] hover:text-fg',
                    label === 'Supprimer' && 'hover:text-loss'
                  )}
                >
                  <Icon size={13} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <IconButton
        icon={<Plus size={14} />}
        label="Nouveau dashboard"
        size="sm"
        disabled={editing}
        onClick={() => setDialog({ kind: 'create' })}
      />
      {dialog?.kind === 'create' ? (
        <TitleDialog
          heading="Nouveau dashboard"
          initial=""
          submitLabel="Créer"
          pending={actions.create.isPending}
          onSubmit={create}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog?.kind === 'rename' ? (
        <TitleDialog
          heading="Renommer le dashboard"
          initial={dialog.title}
          submitLabel="Renommer"
          pending={actions.rename.isPending}
          onSubmit={(title) => rename(dialog.id, title)}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog?.kind === 'delete' ? (
        <Dialog
          title="Supprimer le dashboard ?"
          description={`« ${dialog.title} » et sa disposition seront supprimés définitivement. Tes backtests ne sont pas touchés.`}
          onClose={() => setDialog(null)}
          footer={
            <>
              <Button variant="quiet" onClick={() => setDialog(null)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                disabled={actions.remove.isPending}
                onClick={() => remove(dialog.id)}
              >
                {actions.remove.isPending ? 'Suppression…' : 'Supprimer'}
              </Button>
            </>
          }
        >
          {null}
        </Dialog>
      ) : null}
    </div>
  );
}
