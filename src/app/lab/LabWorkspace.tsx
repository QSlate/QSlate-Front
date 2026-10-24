'use client';

import {
  Activity,
  BarChart3,
  CandlestickChart,
  ChartNoAxesCombined,
  Cpu,
  Layers,
  List,
  Table2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { DEFAULT_LAYOUT, useLayoutStore } from '@/entities/layout';
import { useUserStore } from '@/entities/user/model';
import { useLabStore } from '@/features/lab-state';
import {
  BacktestProvider,
  useBacktest,
} from '@/features/run-backtest/BacktestProvider';
import { useHydratedStore } from '@/shared/lib/store';
import { Dialog } from '@/shared/ui/dialog/Dialog';
import { Toast } from '@/shared/ui/toast';
import { AddWidgetDrawer } from '@/widgets/add-widget-drawer';
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
  ResultControlsProvider,
  TradeLogWidget,
  TradeToolbar,
} from '@/widgets/backtest-results';
import {
  DynamicGridWrapper,
  type WidgetDefinition,
} from '@/widgets/dynamic-grid';
import { LabSidebar } from '@/widgets/lab-sidebar/LabSidebar';
import { LabToolbar } from '@/widgets/lab-toolbar/LabToolbar';

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

function Workspace() {
  const layout = useHydratedStore(
    useLayoutStore,
    (state) => state.layout,
    DEFAULT_LAYOUT
  );
  const colorblind = useHydratedStore(
    useUserStore,
    (state) => state.colorblindMode,
    'none'
  );
  const removeWidget = useLayoutStore((state) => state.removeWidget);
  const openDrawer = useLabStore((state) => state.setAddWidgetDrawerOpen);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rowHeight, setRowHeight] = useState(32);
  const { error, run, status } = useBacktest();
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
        <section className="lab-workspace" aria-label="Lab workspace">
          <LabWorkspaceHeader />
          {layout.length ? (
            <DynamicGridWrapper
              widgets={visibleWidgets}
              onRemove={removeWidget}
              onExpand={setExpanded}
              rowHeight={rowHeight}
            />
          ) : (
            <div className="lab-empty-workspace">
              <ChartNoAxesCombined size={32} strokeWidth={1} />
              <h2>A clear space for your next idea.</h2>
              <p>Add a widget to start exploring your strategy.</p>
              <button
                type="button"
                className="lab-button"
                onClick={() => openDrawer(true)}
              >
                Add Widget
              </button>
            </div>
          )}
        </section>
      </main>
      <AddWidgetDrawer />
      <Toast />
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
    </div>
  );
}

export function LabWorkspace() {
  return (
    <BacktestProvider>
      <ResultControlsProvider>
        <Workspace />
      </ResultControlsProvider>
    </BacktestProvider>
  );
}
