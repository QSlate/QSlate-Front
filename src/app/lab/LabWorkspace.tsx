'use client';

import { BarChart3, ChartNoAxesCombined, List, Table2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { DEFAULT_LAYOUT, useLayoutStore } from '@/entities/layout';
import { useUserStore } from '@/entities/user/model';
import { WidgetPicker } from '@/features/customize-lab/WidgetPicker';
import {
  BacktestProvider,
  useBacktest,
} from '@/features/run-backtest/BacktestProvider';
import { useHydratedStore } from '@/shared/lib/store';
import { Dialog } from '@/shared/ui/dialog/Dialog';
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
  const [pickerOpen, setPickerOpen] = useState(false);
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
        <LabToolbar onAddWidget={() => setPickerOpen(true)} />
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
                onClick={() => setPickerOpen(true)}
              >
                Add Widget
              </button>
            </div>
          )}
        </section>
      </main>
      {pickerOpen ? (
        <WidgetPicker
          widgets={Object.values(widgets)}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
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
