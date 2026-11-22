import { ChartNoAxesColumn, CircleSlash, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { Skeleton } from '@/shared/ui';

interface StateMessageProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description: string;
}

function StateMessage({ icon, title, description }: StateMessageProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-4 text-center">
      <span
        aria-hidden="true"
        className="mb-0.5 grid size-[38px] place-items-center rounded-xl border border-dashed border-line-strong bg-sunken text-fg-3 [&_svg]:size-4"
      >
        {icon}
      </span>
      <b className="text-[12.5px] font-semibold text-fg">{title}</b>
      <span className="max-w-[260px] text-[11.5px] text-fg-3">
        {description}
      </span>
    </div>
  );
}

/** No backtest loaded yet. */
export function ResultEmpty({
  description = 'Lance un backtest pour remplir ce widget.',
}: {
  readonly description?: string | undefined;
}) {
  return (
    <StateMessage
      icon={<ChartNoAxesColumn />}
      title="Disponible après un backtest"
      description={description}
    />
  );
}

/** The backtest exists but does not provide what this widget needs. */
export function ResultUnavailable({
  description,
}: {
  readonly description: string;
}) {
  return (
    <StateMessage
      icon={<CircleSlash />}
      title="Rien à afficher"
      description={description}
    />
  );
}

export function ResultError() {
  return (
    <StateMessage
      icon={<TriangleAlert />}
      title="Résultats indisponibles"
      description="Le chargement des résultats a échoué. Relance le backtest ou réessaie plus tard."
    />
  );
}

/** Shimmering placeholder while a run is live or results load. */
export function ResultSkeleton({
  variant = 'chart',
}: {
  readonly variant?: 'kpi' | 'chart' | undefined;
}) {
  return (
    <div aria-hidden="true" className="absolute inset-x-3.5 bottom-3.5 top-1">
      {variant === 'kpi' ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ) : (
        <Skeleton className="h-full w-full" />
      )}
    </div>
  );
}

interface ResultFrameProps {
  /** Accessible name of the widget content. */
  readonly label: string;
  readonly children: ReactNode;
  readonly busy?: boolean | undefined;
}

/** Positioned body of a result widget (states are absolutely placed). */
export function ResultFrame({ label, children, busy }: ResultFrameProps) {
  return (
    <div
      role="group"
      aria-label={label}
      aria-busy={busy || undefined}
      className="relative h-full min-h-0 w-full"
    >
      {children}
    </div>
  );
}
