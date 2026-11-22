export {
  DashboardConflictError,
  dashboardKeys,
  DEFAULT_DASHBOARD_TITLE,
  saveDashboardLayout,
  useDashboardActions,
  useDashboards,
} from './api/dashboard-queries';
export {
  addDashboardWidget,
  availableWidgets,
  clampItem,
  compactLayout,
  type DashboardItem,
  type DashboardLayout,
  DEFAULT_DASHBOARD_LAYOUT,
  fromGridLayout,
  GRID_COLUMNS,
  moveDashboardWidget,
  removeDashboardWidget,
  resizeDashboardWidget,
  sameLayout,
  sanitizeDashboardLayout,
} from './model/dashboard-layout';
export {
  DASHBOARD_STORAGE_KEY,
  layoutFor,
  LOCAL_DASHBOARD_KEY,
  useDashboardStore,
} from './model/dashboard-store';
