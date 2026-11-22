'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, ApiError, type DashboardSummary } from '@/shared/api';

const DASHBOARD_LIST_LIMIT = 50;
export const DEFAULT_DASHBOARD_TITLE = 'Mon dashboard';

export const dashboardKeys = {
  all: ['dashboards'] as const,
  list: () => [...dashboardKeys.all, 'list'] as const,
};

/** The user's dashboards (tabs), oldest first. */
export function useDashboards() {
  return useQuery({
    queryKey: dashboardKeys.list(),
    queryFn: async (): Promise<readonly DashboardSummary[]> => {
      const page = await apiClient.getDashboards({
        limit: DASHBOARD_LIST_LIMIT,
      });
      return page.items ?? [];
    },
  });
}

/** Raised when the dashboard changed elsewhere since it was loaded. */
export class DashboardConflictError extends Error {
  constructor() {
    super('Dashboard modified elsewhere');
    this.name = 'DashboardConflictError';
  }
}

/**
 * Saves the grid on the server: PUT /dashboards/{id}/layout with the
 * revision known when editing started, so a concurrent change answers 409.
 * Server-side widget instances keep their rectangles.
 */
export async function saveDashboardLayout(
  dashboard: DashboardSummary
): Promise<DashboardSummary> {
  const current = await apiClient.getDashboard(dashboard.id);
  try {
    const saved = await apiClient.updateDashboardLayout(dashboard.id, {
      revision: dashboard.revision,
      items: current.layout ?? [],
    });
    return saved;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 409) {
      throw new DashboardConflictError();
    }
    throw error;
  }
}

/** Create, rename, duplicate, delete and save, refreshing the tab list. */
export function useDashboardActions() {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  const create = useMutation({
    mutationFn: (title: string) => apiClient.createDashboard({ title }),
    onSettled: refresh,
  });
  const rename = useMutation({
    mutationFn: ({
      id,
      title,
    }: {
      readonly id: string;
      readonly title: string;
    }) => apiClient.updateDashboard(id, { title }),
    onSettled: refresh,
  });
  const duplicate = useMutation({
    mutationFn: (id: string) => apiClient.duplicateDashboard(id),
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiClient.deleteDashboard(id),
    onSettled: refresh,
  });
  const save = useMutation({
    mutationFn: saveDashboardLayout,
    onSettled: refresh,
  });
  return { create, rename, duplicate, remove, save };
}
