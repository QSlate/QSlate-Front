'use client';

import { type FormEvent, useId, useState } from 'react';

import {
  DASHBOARD_TEMPLATES,
  type DashboardTemplateId,
  DEFAULT_DASHBOARD_TEMPLATE,
  templateLayout,
} from '@/features/customize-lab';
import { useBacktest } from '@/features/run-backtest';
import { cn } from '@/shared/lib/class-names';
import { Button, Dialog, Input } from '@/shared/ui';

import type { WidgetComponents } from '../model/types';
import { DashboardPreview } from './dashboard-preview';

const MAX_TITLE = 150;

interface CreateDashboardDialogProps {
  readonly components: WidgetComponents;
  readonly pending: boolean;
  readonly onSubmit: (title: string, template: DashboardTemplateId) => void;
  readonly onClose: () => void;
}

/** "Nouveau dashboard": a name and the template it starts from. */
export function CreateDashboardDialog({
  components,
  pending,
  onSubmit,
  onClose,
}: CreateDashboardDialogProps) {
  const [template, setTemplate] = useState<DashboardTemplateId>(
    DEFAULT_DASHBOARD_TEMPLATE
  );
  // Until the user types a name, the name follows the chosen template.
  const [typedTitle, setTypedTitle] = useState<string | null>(null);
  const { result } = useBacktest();
  const formId = useId();
  const chosen = DASHBOARD_TEMPLATES.find((item) => item.id === template);
  const title = typedTitle ?? chosen?.title ?? '';
  const trimmed = title.trim();
  const error = trimmed === '' ? 'Donne un nom au dashboard.' : null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!error && !pending) onSubmit(trimmed, template);
  };

  return (
    <Dialog
      title="Nouveau dashboard"
      description="Choisis un point de départ. Tu pourras ensuite ajouter, déplacer ou retirer des widgets avec « Personnaliser »."
      onClose={onClose}
      className="[--dialog-width:min(1040px,calc(100vw-32px))]"
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
            {pending ? 'Création…' : 'Créer'}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={submit}
        className="mt-4 grid gap-5 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]"
      >
        <div className="flex min-w-0 flex-col gap-4">
          <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
            <legend className="mb-2 p-0 text-[12.5px] font-medium text-fg">
              Modèle
            </legend>
            {DASHBOARD_TEMPLATES.map((item) => {
              const selected = item.id === template;
              const titleId = `${formId}-${item.id}-title`;
              const descriptionId = `${formId}-${item.id}-description`;
              return (
                <label
                  key={item.id}
                  className={cn(
                    'flex cursor-pointer flex-col gap-1 rounded-xl border px-3 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand',
                    selected
                      ? 'border-brand bg-brand-soft'
                      : 'border-line hover:border-line-strong'
                  )}
                >
                  <input
                    type="radio"
                    name={`${formId}-template`}
                    value={item.id}
                    checked={selected}
                    onChange={() => setTemplate(item.id)}
                    aria-labelledby={titleId}
                    aria-describedby={descriptionId}
                    className="sr-only"
                  />
                  <span className="flex items-baseline justify-between gap-2">
                    <span
                      id={titleId}
                      className="text-[13px] font-semibold text-fg"
                    >
                      {item.title}
                    </span>
                    <span className="font-mono text-[11px] text-fg-3">
                      {item.layout.length} widget
                      {item.layout.length > 1 ? 's' : ''}
                    </span>
                  </span>
                  <span
                    id={descriptionId}
                    className="text-[11.5px] leading-snug text-fg-2"
                  >
                    {item.description}
                  </span>
                </label>
              );
            })}
          </fieldset>
          <div className="flex flex-col gap-1.5">
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
              invalid={Boolean(error)}
              aria-describedby={error ? `${formId}-title-error` : undefined}
              onChange={(event) => setTypedTitle(event.target.value)}
            />
            {error ? (
              <p
                id={`${formId}-title-error`}
                className="m-0 text-[11.5px] text-loss"
              >
                {error}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-2 max-md:hidden">
          <p className="m-0 flex items-baseline justify-between gap-3 text-[12.5px]">
            <span className="font-medium text-fg">Aperçu</span>
            {template === 'empty' ? null : (
              <span className="text-[11.5px] text-fg-3">
                {result
                  ? 'Avec les résultats du backtest affiché'
                  : 'Lance un backtest pour remplir les widgets'}
              </span>
            )}
          </p>
          <div className="h-[440px]">
            {/* Keyed so each template opens scrolled to its top. */}
            <DashboardPreview
              key={template}
              layout={templateLayout(template)}
              components={components}
            />
          </div>
        </div>
      </form>
    </Dialog>
  );
}
