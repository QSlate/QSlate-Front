import type { ReactNode } from 'react';

import { BacktestErrorBanner } from './backtest-error-banner';

export interface LabHeaderProps {
  /** Page title, rendered as the page's single <h1>. */
  readonly title: string;
  /** Short context next to the title (counts, version, period). */
  readonly subtitle?: ReactNode | undefined;
  /** Centre/right content such as the run composer. */
  readonly children?: ReactNode | undefined;
  /** Right-aligned page actions. */
  readonly actions?: ReactNode | undefined;
}

/** 64px glassy page header used by every /lab page inside the shared frame. */
export function LabHeader({
  title,
  subtitle,
  children,
  actions,
}: LabHeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-[4] flex h-16 shrink-0 items-center gap-3 border-b border-line bg-[color-mix(in_srgb,var(--surface)_55%,transparent)] px-[22px] backdrop-blur-[14px]">
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="m-0 truncate text-[14.5px] font-semibold tracking-[-0.01em] text-fg">
            {title}
          </h1>
          {subtitle ? (
            <span className="truncate font-mono text-[11px] text-fg-3">
              {subtitle}
            </span>
          ) : null}
        </div>
        <span className="flex-1" />
        {children}
        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : null}
      </header>
      <BacktestErrorBanner />
    </>
  );
}
