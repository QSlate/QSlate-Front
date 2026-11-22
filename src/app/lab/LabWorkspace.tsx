'use client';

import { FlaskConical, Terminal } from 'lucide-react';

import { useLabStore } from '@/features/lab-state';
import { IconButton, Tooltip } from '@/shared/ui';
import {
  CapitalChartWidget,
  DrawdownChartWidget,
  MaxDrawdownWidget,
  MonthlyReturnsWidget,
  NetReturnWidget,
  SharpeWidget,
  TradeDistributionWidget,
  TradesTableWidget,
  WinRateWidget,
} from '@/widgets/backtest-results';
import {
  CustomizeDashboardButton,
  DashboardTabs,
  LabDashboard,
  type WidgetComponents,
} from '@/widgets/lab-dashboard';
import { LabHeader, RunStatusStrip } from '@/widgets/lab-frame';
import { RunComposer, RunComposerHint } from '@/widgets/run-composer';

const WIDGET_COMPONENTS: WidgetComponents = {
  'net-return': NetReturnWidget,
  'max-drawdown': MaxDrawdownWidget,
  sharpe: SharpeWidget,
  'win-rate': WinRateWidget,
  'capital-chart': CapitalChartWidget,
  drawdowns: DrawdownChartWidget,
  'monthly-returns': MonthlyReturnsWidget,
  'trade-distribution': TradeDistributionWidget,
  trades: TradesTableWidget,
};

/** Lab page: run composer, live status, dashboard tabs and widgets. */
export function LabWorkspace() {
  const isLogsOpen = useLabStore((state) => state.isExecutionLogsOpen);
  const toggleLogs = useLabStore((state) => state.toggleExecutionLogs);
  const openOptimization = useLabStore(
    (state) => state.setOptimizationModalOpen
  );

  return (
    <>
      <LabHeader
        title="Lab"
        actions={
          <>
            <Tooltip content="Journal d'exécution">
              {(triggerProps) => (
                <IconButton
                  {...triggerProps}
                  icon={<Terminal size={16} />}
                  label="Logs d'exécution"
                  aria-pressed={isLogsOpen}
                  onClick={toggleLogs}
                />
              )}
            </Tooltip>
            <Tooltip content="Optimiser les paramètres">
              {(triggerProps) => (
                <IconButton
                  {...triggerProps}
                  icon={<FlaskConical size={16} />}
                  label="Optimiser la stratégie"
                  onClick={() => openOptimization(true)}
                />
              )}
            </Tooltip>
            <CustomizeDashboardButton />
          </>
        }
      >
        <RunComposer />
      </LabHeader>
      <RunComposerHint />
      <RunStatusStrip>
        <DashboardTabs />
      </RunStatusStrip>
      <LabDashboard components={WIDGET_COMPONENTS} />
    </>
  );
}
