'use client';

import { useCallback } from 'react';

import type { LabWidgetType } from '@/entities/widget';
import {
  addDashboardWidget,
  DashboardConflictError,
  type DashboardLayout,
  DEFAULT_DASHBOARD_TITLE,
  layoutFor,
  LOCAL_DASHBOARD_KEY,
  removeDashboardWidget,
  sameLayout,
  useActiveDashboardId,
  useDashboardActions,
  useDashboards,
  useDashboardStore,
  useSavedDashboardLayouts,
} from '@/features/customize-lab';
import { useLabStore } from '@/features/lab-state';
import type { DashboardSummary } from '@/shared/api';

export interface DashboardEditor {
  readonly active: DashboardSummary | null;
  /** Layout on screen: the draft while editing, else the saved one. */
  readonly layout: DashboardLayout;
  readonly editing: boolean;
  readonly dirty: boolean;
  readonly saving: boolean;
  readonly catalogOpen: boolean;
  readonly start: () => void;
  readonly openCatalog: () => void;
  readonly closeCatalog: () => void;
  readonly change: (layout: DashboardLayout) => void;
  readonly add: (type: LabWidgetType) => void;
  readonly remove: (type: LabWidgetType) => void;
  readonly cancel: () => void;
  readonly save: () => void;
}

/** Edit session of the active dashboard ("Personnaliser"). */
export function useDashboardEditor(): DashboardEditor {
  const dashboards = useDashboards();
  const actions = useDashboardActions();
  const activeId = useActiveDashboardId();
  const layouts = useSavedDashboardLayouts();
  const draft = useDashboardStore((state) => state.draft);
  const catalogOpen = useDashboardStore((state) => state.catalogOpen);
  const setActive = useDashboardStore((state) => state.setActive);
  const saveLayout = useDashboardStore((state) => state.saveLayout);
  const forgetLayout = useDashboardStore((state) => state.forgetLayout);
  const startEditing = useDashboardStore((state) => state.startEditing);
  const updateDraft = useDashboardStore((state) => state.updateDraft);
  const stopEditing = useDashboardStore((state) => state.stopEditing);
  const setCatalogOpen = useDashboardStore((state) => state.setCatalogOpen);
  const showToast = useLabStore((state) => state.showToast);

  const items = dashboards.data ?? [];
  const active = items.find((item) => item.id === activeId) ?? items[0] ?? null;
  const key = active?.id ?? LOCAL_DASHBOARD_KEY;
  const saved = layoutFor(layouts, key);
  const layout = draft ?? saved;
  const editing = draft !== null;

  const start = useCallback(() => {
    if (!editing) startEditing(saved);
  }, [editing, saved, startEditing]);

  const openCatalog = useCallback(() => {
    if (!editing) startEditing(saved);
    setCatalogOpen(true);
  }, [editing, saved, setCatalogOpen, startEditing]);

  const commit = (id: string, next: DashboardLayout) => {
    saveLayout(id, next);
    if (id !== key) forgetLayout(key);
    setActive(id);
    stopEditing();
    showToast('Dashboard enregistré', 'success');
  };

  const save = () => {
    if (!draft || actions.save.isPending || actions.create.isPending) return;
    if (!active) {
      actions.create.mutate(DEFAULT_DASHBOARD_TITLE, {
        onSuccess: (created) => commit(created.id, draft),
        onError: () =>
          showToast("Impossible d'enregistrer le dashboard.", 'error'),
      });
      return;
    }
    actions.save.mutate(active, {
      onSuccess: () => commit(active.id, draft),
      onError: (error) => {
        if (error instanceof DashboardConflictError) {
          void dashboards.refetch();
          showToast(
            'Ce dashboard a été modifié ailleurs : sa dernière version est rechargée. Enregistre à nouveau pour garder tes changements.',
            'warning'
          );
        } else {
          showToast("Impossible d'enregistrer le dashboard.", 'error');
        }
      },
    });
  };

  return {
    active,
    layout,
    editing,
    dirty: editing && !sameLayout(layout, saved),
    saving: actions.save.isPending || actions.create.isPending,
    catalogOpen,
    start,
    openCatalog,
    closeCatalog: () => setCatalogOpen(false),
    change: updateDraft,
    add: (type) => updateDraft(addDashboardWidget(layout, type)),
    remove: (type) => updateDraft(removeDashboardWidget(layout, type)),
    cancel: stopEditing,
    save,
  };
}
