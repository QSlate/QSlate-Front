'use client';

import { Terminal } from 'lucide-react';

import { useHasBacktests } from '@/entities/backtest';
import { useLabStore } from '@/features/lab-state';
import { useBacktest } from '@/features/run-backtest';
import { IconButton, Tooltip } from '@/shared/ui';
import {
  CapitalChartWidget,
  DrawdownChartWidget,
  MaxDrawdownWidget,
  MonthlyReturnsWidget,
  NetReturnWidget,
  PriceChartWidget,
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
import { LabWelcome } from '@/widgets/lab-welcome';
import { RunComposer, RunComposerHint } from '@/widgets/run-composer';

const WIDGET_COMPONENTS: WidgetComponents = {
  'net-return': NetReturnWidget,
  'max-drawdown': MaxDrawdownWidget,
  sharpe: SharpeWidget,
  'win-rate': WinRateWidget,
  'capital-chart': CapitalChartWidget,
  'price-chart': PriceChartWidget,
  drawdowns: DrawdownChartWidget,
  'monthly-returns': MonthlyReturnsWidget,
  'trade-distribution': TradeDistributionWidget,
  trades: TradesTableWidget,
};

/** Lab page: run composer, live status, dashboard tabs and widgets. */
export function LabWorkspace() {
  const isLogsOpen = useLabStore((state) => state.isExecutionLogsOpen);
  const toggleLogs = useLabStore((state) => state.toggleExecutionLogs);
  const hasBacktests = useHasBacktests();
  const { status, result } = useBacktest();
  const firstRun =
    hasBacktests.data === false && status === 'idle' && result === null;

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
            {firstRun ? null : <CustomizeDashboardButton />}
          </>
        }
      >
        <RunComposer />
      </LabHeader>
      <RunComposerHint />
      {firstRun ? (
        <LabWelcome />
      ) : (
        <>
          <RunStatusStrip>
            <DashboardTabs components={WIDGET_COMPONENTS} />
          </RunStatusStrip>
          <LabDashboard components={WIDGET_COMPONENTS} />
        </>
      )}
    </>
  );
}
