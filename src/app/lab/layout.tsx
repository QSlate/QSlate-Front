import './lab.css';

import type { ReactNode } from 'react';

import { CustomDatasetsDrawer } from '@/features/custom-datasets';
import { StrategyOptimizationModal } from '@/features/optimize-strategy';
import { BacktestProvider } from '@/features/run-backtest';
import { Toast } from '@/shared/ui/toast';
import { ExecutionLogsConsole } from '@/widgets/execution-logs';
import { LabRail } from '@/widgets/lab-frame';

interface LabLayoutProps {
  readonly children: ReactNode;
}

/**
 * Single frame for every /lab route: the backtest state, icon rail and
 * global overlays mount once and survive client-side navigation. Access is
 * guarded by the middleware (redirect to /login without a valid token).
 */
export default function LabLayout({ children }: LabLayoutProps) {
  return (
    <BacktestProvider>
      <div className="lab-shell isolate grid min-h-dvh grid-cols-[72px_minmax(0,1fr)] bg-canvas bg-[radial-gradient(900px_420px_at_30%_-10%,var(--amb1),transparent_70%),radial-gradient(700px_380px_at_95%_0%,var(--amb2),transparent_70%)] bg-fixed font-sans text-fg">
        <LabRail />
        <main className="flex min-w-0 flex-col">{children}</main>
        <ExecutionLogsConsole />
        <StrategyOptimizationModal />
        <CustomDatasetsDrawer />
        <Toast />
      </div>
    </BacktestProvider>
  );
}
