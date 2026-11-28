'use client';

import { useEffect, useRef } from 'react';

import {
  useActiveDashboardId,
  useDashboards,
  useDashboardStore,
} from '@/features/customize-lab';

export const DASHBOARD_URL_PARAM = 'dashboard';

/**
 * Keeps the shown dashboard in the URL (`/lab?dashboard=<id>`): the id is
 * restored once the user's dashboards are known, then every tab change
 * replaces it, so a reload or a shared link reopens the same dashboard.
 * An id the user does not own is ignored.
 */
export function useDashboardUrl(): void {
  const dashboards = useDashboards();
  const activeId = useActiveDashboardId();
  const setActive = useDashboardStore((state) => state.setActive);
  const restored = useRef(false);
  const items = dashboards.data;

  useEffect(() => {
    if (restored.current || !items) return;
    restored.current = true;
    const wanted = new URLSearchParams(window.location.search).get(
      DASHBOARD_URL_PARAM
    );
    if (
      wanted &&
      wanted !== useDashboardStore.getState().activeId &&
      items.some((item) => item.id === wanted)
    ) {
      setActive(wanted);
    }
  }, [items, setActive]);

  // Same fallback as the tabs: the first dashboard when none is active.
  const shownId = items
    ? ((items.find((item) => item.id === activeId) ?? items[0])?.id ?? null)
    : undefined;

  useEffect(() => {
    if (!restored.current || shownId === undefined) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get(DASHBOARD_URL_PARAM) === shownId) return;
    if (shownId) url.searchParams.set(DASHBOARD_URL_PARAM, shownId);
    else url.searchParams.delete(DASHBOARD_URL_PARAM);
    window.history.replaceState(window.history.state, '', url);
  }, [shownId]);
}
