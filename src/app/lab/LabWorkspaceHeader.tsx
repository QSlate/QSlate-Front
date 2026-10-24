'use client';

import { RotateCcw } from 'lucide-react';

import { DEFAULT_LAYOUT, useLayoutStore } from '@/entities/layout';
import { useBacktest } from '@/features/run-backtest/BacktestProvider';
import { useHydratedStore } from '@/shared/lib/store';

export function LabWorkspaceHeader() {
  const layout = useHydratedStore(
    useLayoutStore,
    (state) => state.layout,
    DEFAULT_LAYOUT
  );
  const resetLayout = useLayoutStore((state) => state.resetLayout);
  const { status, config, result } = useBacktest();
  const isDefault =
    layout.length === DEFAULT_LAYOUT.length &&
    layout.every((item, index) => {
      const original = DEFAULT_LAYOUT[index];
      return (
        item.i === original.i &&
        item.x === original.x &&
        item.y === original.y &&
        item.w === original.w &&
        item.h === original.h &&
        !item.isMinimized &&
        !item.isPinned
      );
    });
  const dirty =
    config.strategyId !== result.config.strategyId ||
    config.startDate !== result.config.startDate ||
    config.endDate !== result.config.endDate ||
    config.timeframe !== result.config.timeframe ||
    config.capital !== result.config.capital;
  return (
    <div className="lab-workspace-heading">
      <div>
        <h1>Lab Workspace</h1>
        <span className="lab-demo-badge">
          {result.source === 'mock' ? 'DEMO' : 'BACKTEST'}
        </span>
        <span className="lab-run-status" role="status">
          {status === 'running'
            ? 'Simulating backtest…'
            : dirty
              ? 'Parameters changed · run to update'
              : status === 'success'
                ? 'Simulation complete'
                : ''}
        </span>
      </div>
      <div className="lab-layout-info">
        <span>
          {layout.length} widgets · layout: {isDefault ? 'default' : 'custom'}
        </span>
        <button
          type="button"
          className="lab-icon-button"
          title="Reset layout"
          aria-label="Reset layout"
          onClick={() => resetLayout()}
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
}
