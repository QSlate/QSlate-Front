'use client';

import { LayoutDashboard, LayoutGrid, Plus } from 'lucide-react';

import { cn } from '@/shared/lib/class-names';
import { Button, EmptyState, Kbd } from '@/shared/ui';

import type { WidgetComponents } from '../model/types';
import { useDashboardEditor } from '../model/use-dashboard-editor';
import { DashboardGridLazy } from './dashboard-grid-lazy';
import { WidgetCatalogDrawer } from './widget-catalog-drawer';

interface LabDashboardProps {
  readonly components: WidgetComponents;
}

/** The customizable result dashboard of the Lab page. */
export function LabDashboard({ components }: LabDashboardProps) {
  const editor = useDashboardEditor();
  const { layout, editing } = editor;

  return (
    <section
      aria-label="Dashboard"
      className={cn(
        'relative flex-1 px-[22px] pb-24 pt-3.5',
        editing &&
          'before:pointer-events-none before:absolute before:inset-x-[14px] before:bottom-0 before:top-1.5 before:rounded-[14px] before:bg-[radial-gradient(var(--line-strong)_1px,transparent_1.4px)] before:bg-[length:calc(100%/12)_56px] before:opacity-90'
      )}
    >
      <p id="qs-dashboard-keys" className="sr-only">
        Flèches pour déplacer, Maj + flèches pour redimensionner, Suppr pour
        retirer le widget.
      </p>
      {layout.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid />}
          title="Ton dashboard est vide"
          description="Ajoute des widgets pour explorer les résultats de tes backtests."
          action={
            <Button
              leadingIcon={<Plus size={15} />}
              onClick={editor.openCatalog}
            >
              Ajouter un widget
            </Button>
          }
        />
      ) : (
        <DashboardGridLazy
          layout={layout}
          editing={editing}
          components={components}
          onChange={editor.change}
          onRemove={editor.remove}
        />
      )}
      {editing ? (
        <div
          role="toolbar"
          aria-label="Mode personnalisation"
          className="fixed bottom-[18px] left-[94px] z-[8] flex items-center gap-2.5 whitespace-nowrap rounded-[14px] border border-line-strong bg-[color-mix(in_srgb,var(--raised)_85%,transparent)] py-2 pl-4 pr-2 text-[12.5px] text-fg-2 shadow-pop backdrop-blur-[14px]"
        >
          <LayoutDashboard
            size={15}
            className="text-brand"
            aria-hidden="true"
          />
          <span>
            <b className="font-semibold text-fg">Mode personnalisation</b>
            <span className="max-lg:hidden">
              {' · '}glisse pour déplacer, tire le coin pour redimensionner ·{' '}
              <Kbd>Maj</Kbd> + flèches au clavier
            </span>
          </span>
          <Button
            size="sm"
            variant="secondary"
            leadingIcon={<Plus size={13} />}
            onClick={editor.openCatalog}
          >
            Ajouter un widget
          </Button>
          <Button
            size="sm"
            variant="quiet"
            onClick={editor.cancel}
            disabled={editor.saving}
          >
            Annuler
          </Button>
          <Button size="sm" onClick={editor.save} disabled={editor.saving}>
            {editor.saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      ) : null}
      <WidgetCatalogDrawer
        open={editor.catalogOpen}
        onClose={editor.closeCatalog}
        placed={layout.map((item) => item.i)}
        onAdd={editor.add}
      />
    </section>
  );
}

/** Header button entering the edit mode. */
export function CustomizeDashboardButton() {
  const editor = useDashboardEditor();
  return (
    <Button
      variant="secondary"
      leadingIcon={<LayoutDashboard size={15} />}
      aria-pressed={editor.editing}
      onClick={editor.start}
      disabled={editor.editing}
    >
      Personnaliser
    </Button>
  );
}
