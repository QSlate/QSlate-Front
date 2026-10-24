'use client';

import { type ReactNode } from 'react';

import { useUserStore } from '@/entities/user/model';
import { useLabStore } from '@/features/lab-state';
import {
  BacktestProvider,
  useBacktest,
} from '@/features/run-backtest/BacktestProvider';
import { useHydratedStore } from '@/shared/lib/store';
import { Toast } from '@/shared/ui/toast';
import { AddWidgetDrawer } from '@/widgets/add-widget-drawer';
import { ResultControlsProvider } from '@/widgets/backtest-results';
import { LabSidebar } from '@/widgets/lab-sidebar/LabSidebar';
import { LabToolbar } from '@/widgets/lab-toolbar/LabToolbar';

function ShellInner({ children }: { children: ReactNode }) {
  const colorblind = useHydratedStore(
    useUserStore,
    (state) => state.colorblindMode,
    'none'
  );
  const openDrawer = useLabStore((state) => state.setAddWidgetDrawerOpen);
  const { error, run, status } = useBacktest();

  return (
    <div className="lab-shell" data-colorblind={colorblind}>
      <LabSidebar />
      <main className="lab-main">
        <LabToolbar onAddWidget={() => openDrawer(true)} />
        {error ? (
          <div className="lab-error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void run()}
              disabled={status === 'running'}
            >
              Try again
            </button>
          </div>
        ) : null}
        {children}
      </main>
      <AddWidgetDrawer />
      <Toast />
    </div>
  );
}

export function LabShell({ children }: { children: ReactNode }) {
  return (
    <BacktestProvider>
      <ResultControlsProvider>
        <ShellInner>{children}</ShellInner>
      </ResultControlsProvider>
    </BacktestProvider>
  );
}
