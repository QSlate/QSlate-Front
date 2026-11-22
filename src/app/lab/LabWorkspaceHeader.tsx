'use client';

import { Cloud, Copy, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect } from 'react';

import { DEFAULT_LAYOUT, useLayoutStore } from '@/entities/layout';
import { useAuthStore } from '@/entities/user/model';
import { useBacktest } from '@/features/run-backtest';
import { useHydratedStore } from '@/shared/lib/store';

export function LabWorkspaceHeader() {
  const layout = useHydratedStore(
    useLayoutStore,
    (state) => state.layout,
    DEFAULT_LAYOUT
  );
  const resetLayout = useLayoutStore((state) => state.resetLayout);
  const dashboards = useLayoutStore((state) => state.dashboards);
  const activeDashboardId = useLayoutStore((state) => state.activeDashboardId);
  const activeDashboardTitle = useLayoutStore(
    (state) => state.activeDashboardTitle
  );
  const isSyncing = useLayoutStore((state) => state.isSyncing);
  const loadDashboards = useLayoutStore((state) => state.loadDashboards);
  const selectDashboard = useLayoutStore((state) => state.selectDashboard);
  const createDashboard = useLayoutStore((state) => state.createDashboard);
  const duplicateActiveDashboard = useLayoutStore(
    (state) => state.duplicateActiveDashboard
  );
  const deleteActiveDashboard = useLayoutStore(
    (state) => state.deleteActiveDashboard
  );
  const saveServerLayout = useLayoutStore((state) => state.saveServerLayout);

  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { status, config, result } = useBacktest();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      void loadDashboards(accessToken);
    }
  }, [isAuthenticated, accessToken, loadDashboards]);

  const handleCreateDashboard = async () => {
    const name = window.prompt('Enter new dashboard name:');
    if (name && name.trim()) {
      try {
        await createDashboard(name.trim());
      } catch (err) {
        console.error('Failed to create dashboard', err);
      }
    }
  };

  const handleDuplicateDashboard = async () => {
    try {
      await duplicateActiveDashboard();
    } catch (err) {
      console.error('Failed to duplicate dashboard', err);
    }
  };

  const handleDeleteDashboard = async () => {
    if (window.confirm(`Delete dashboard "${activeDashboardTitle}"?`)) {
      try {
        await deleteActiveDashboard();
      } catch (err) {
        console.error('Failed to delete dashboard', err);
      }
    }
  };

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
        <div
          className="lab-dashboard-picker"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <select
            aria-label="Select Dashboard"
            value={activeDashboardId ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val) void selectDashboard(val);
            }}
            className="lab-dashboard-select"
            style={{
              background: 'var(--lab-surface, #1e222d)',
              color: 'var(--lab-text, #d1d4dc)',
              border: '1px solid var(--lab-border, #2a2e39)',
              borderRadius: '3px',
              fontSize: '11px',
              padding: '2px 6px',
              cursor: 'pointer',
              maxWidth: '160px',
            }}
          >
            <option value="" disabled={dashboards.length > 0}>
              {activeDashboardTitle}
            </option>
            {dashboards.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="lab-icon-button"
            title="New Dashboard"
            aria-label="New Dashboard"
            onClick={handleCreateDashboard}
          >
            <Plus size={12} />
          </button>
          {activeDashboardId && (
            <>
              <button
                type="button"
                className="lab-icon-button"
                title="Duplicate Dashboard"
                aria-label="Duplicate Dashboard"
                onClick={handleDuplicateDashboard}
              >
                <Copy size={12} />
              </button>
              <button
                type="button"
                className="lab-icon-button"
                title="Delete Dashboard"
                aria-label="Delete Dashboard"
                onClick={handleDeleteDashboard}
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
        {result.id ? <span className="lab-demo-badge">BACKTEST</span> : null}
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
      <div
        className="lab-layout-info"
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        {activeDashboardId && (
          <button
            type="button"
            className="lab-icon-button"
            title="Save layout to server"
            aria-label="Save layout to server"
            onClick={() => void saveServerLayout()}
            disabled={isSyncing}
            style={{ gap: '4px', display: 'inline-flex', alignItems: 'center' }}
          >
            <Cloud size={12} color={isSyncing ? '#60a5fa' : '#34d399'} />
            <span style={{ fontSize: '9px' }}>
              {isSyncing ? 'Syncing…' : 'Synced'}
            </span>
          </button>
        )}
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
