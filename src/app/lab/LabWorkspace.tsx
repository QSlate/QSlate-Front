'use client';

import {
  ChartNoAxesCombined,
  FlaskConical,
  Plus,
  Terminal,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { DEFAULT_LAYOUT, useLayoutStore } from '@/entities/layout';
import { LAB_WIDGETS, type LabWidgetType } from '@/entities/widget';
import { useLabStore } from '@/features/lab-state';
import { useHydratedStore } from '@/shared/lib/store';
import { Button, EmptyState, IconButton, Tooltip } from '@/shared/ui';
import { Dialog } from '@/shared/ui/dialog';
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
  DynamicGridWrapper,
  type WidgetComponentProps,
  type WidgetDefinition,
} from '@/widgets/dynamic-grid';
import { LabHeader, RunStatusStrip } from '@/widgets/lab-frame';
import { RunComposer, RunComposerHint } from '@/widgets/run-composer';

import { LabWorkspaceHeader } from './LabWorkspaceHeader';

const COMPONENTS: Readonly<
  Record<LabWidgetType, ComponentType<WidgetComponentProps>>
> = {
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

const widgets: Record<string, WidgetDefinition> = Object.fromEntries(
  LAB_WIDGETS.map((widget) => [
    widget.type,
    {
      id: widget.type,
      title: widget.title,
      component: COMPONENTS[widget.type],
    },
  ])
);

export function LabWorkspace() {
  const layout = useHydratedStore(
    useLayoutStore,
    (state) => state.layout,
    DEFAULT_LAYOUT
  );
  const removeWidget = useLayoutStore((state) => state.removeWidget);
  const openDrawer = useLabStore((state) => state.setAddWidgetDrawerOpen);
  const isLogsOpen = useLabStore((state) => state.isExecutionLogsOpen);
  const toggleLogs = useLabStore((state) => state.toggleExecutionLogs);
  const openOptimization = useLabStore(
    (state) => state.setOptimizationModalOpen
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rowHeight, setRowHeight] = useState(32);
  useEffect(() => {
    const resize = () =>
      setRowHeight(
        window.innerWidth < 768
          ? 36
          : Math.max(30, Math.min(65, (window.innerHeight - 225) / 14))
      );
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const visibleWidgets = useMemo(
    () =>
      Object.fromEntries(
        layout
          .filter((item) => widgets[item.i])
          .map((item) => [item.i, widgets[item.i]])
      ),
    [layout]
  );
  const expandedWidget = expanded ? widgets[expanded] : null;
  const ExpandedComponent = expandedWidget?.component;

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
            <Tooltip content="Ajouter un widget">
              {(triggerProps) => (
                <IconButton
                  {...triggerProps}
                  icon={<Plus size={16} />}
                  label="Ajouter un widget"
                  onClick={() => openDrawer(true)}
                />
              )}
            </Tooltip>
          </>
        }
      >
        <RunComposer />
      </LabHeader>
      <RunComposerHint />
      <RunStatusStrip />
      <section className="lab-workspace" aria-label="Espace de travail du Lab">
        <LabWorkspaceHeader />
        {layout.length ? (
          <DynamicGridWrapper
            widgets={visibleWidgets}
            onRemove={removeWidget}
            onExpand={setExpanded}
            rowHeight={rowHeight}
          />
        ) : (
          <EmptyState
            className="lab-empty-workspace"
            icon={<ChartNoAxesCombined />}
            title="Ton dashboard est vide"
            description="Ajoute un widget pour explorer les résultats de ta stratégie."
            action={
              <Button
                leadingIcon={<Plus size={15} />}
                onClick={() => openDrawer(true)}
              >
                Ajouter un widget
              </Button>
            }
          />
        )}
      </section>
      {expandedWidget && ExpandedComponent ? (
        <Dialog
          title={expandedWidget.title}
          className="lab-expanded-dialog"
          onClose={() => setExpanded(null)}
        >
          <div className="lab-expanded-content">
            <ExpandedComponent id={expandedWidget.id} />
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
