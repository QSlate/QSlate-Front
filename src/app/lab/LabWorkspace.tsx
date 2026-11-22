'use client';

import {
  Activity,
  BarChart3,
  CandlestickChart,
  ChartNoAxesCombined,
  Cpu,
  FlaskConical,
  Layers,
  List,
  Plus,
  Table2,
  Terminal,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { DEFAULT_LAYOUT, useLayoutStore } from '@/entities/layout';
import { useLabStore } from '@/features/lab-state';
import { useHydratedStore } from '@/shared/lib/store';
import { Button, EmptyState, IconButton, Tooltip } from '@/shared/ui';
import { Dialog } from '@/shared/ui/dialog';
import {
  MonteCarloWidget,
  OrderBookWidget,
  VolatilityFilterWidget,
} from '@/widgets/additional-widgets';
import {
  DrawdownWidget,
  EquityToolbar,
  EquityWidget,
  MetricsWidget,
  TradeLogWidget,
  TradeToolbar,
} from '@/widgets/backtest-results';
import {
  DynamicGridWrapper,
  type WidgetDefinition,
} from '@/widgets/dynamic-grid';
import { LabHeader, RunStatusStrip } from '@/widgets/lab-frame';
import { RunComposer, RunComposerHint } from '@/widgets/run-composer';

import { LabWorkspaceHeader } from './LabWorkspaceHeader';

const widgets: Record<string, WidgetDefinition & { description: string }> = {
  'equity-curve': {
    id: 'equity-curve',
    title: 'Portfolio Equity Curve',
    description: 'Strategy NAV and benchmark performance.',
    component: EquityWidget,
    icon: <ChartNoAxesCombined size={13} />,
    toolbar: EquityToolbar,
  },
  drawdown: {
    id: 'drawdown',
    title: 'Drawdown & Regime Waterfall',
    description: 'Monthly returns and drawdown duration.',
    component: DrawdownWidget,
    icon: <BarChart3 size={13} />,
  },
  'execution-metrics': {
    id: 'execution-metrics',
    title: 'Executive Quant Metrics',
    description: 'Risk, returns and execution statistics.',
    component: MetricsWidget,
    icon: <Table2 size={13} />,
  },
  'trade-log': {
    id: 'trade-log',
    title: 'Trade Execution Log',
    description: 'Inspect entries, exits and individual trades.',
    component: TradeLogWidget,
    icon: <List size={13} />,
    toolbar: TradeToolbar,
  },
  'monte-carlo': {
    id: 'monte-carlo',
    title: 'Monte Carlo 10k Simulator',
    description: '10,000 randomized path projection with confidence fans.',
    component: MonteCarloWidget,
    icon: <Activity size={13} />,
  },
  'order-book': {
    id: 'order-book',
    title: 'Order Book Heatmap L2',
    description: 'Market depth liquidity matrix & real-time bid/ask pressure.',
    component: OrderBookWidget,
    icon: <Layers size={13} />,
  },
  'volatility-filter': {
    id: 'volatility-filter',
    title: 'Regime-Aware Volatility Filter',
    description: 'Gaussian Mixture Model volatility state classification.',
    component: VolatilityFilterWidget,
    icon: <Cpu size={13} />,
  },
  'tradingview-candles': {
    id: 'tradingview-candles',
    title: 'TradingView Market Terminal',
    description:
      'Institutional OHLC candlesticks with multi-asset ticker selector.',
    component: EquityWidget,
    icon: <CandlestickChart size={13} />,
    toolbar: EquityToolbar,
  },
};

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
  const ExpandedToolbar = expandedWidget?.toolbar;

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
          {ExpandedToolbar ? (
            <div className="lab-expanded-toolbar">
              <ExpandedToolbar />
            </div>
          ) : null}
          <div className="lab-expanded-content">
            <ExpandedComponent id={expandedWidget.id} />
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
