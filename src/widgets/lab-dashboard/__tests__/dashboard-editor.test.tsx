// @vitest-environment jsdom
import { QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_DASHBOARD_LAYOUT,
  useDashboardStore,
} from '@/features/customize-lab';
import { useLabStore } from '@/features/lab-state';
import { apiClient, ApiError } from '@/shared/api';
import { createTestQueryClient } from '@/shared/lib/test';

import { useDashboardEditor } from '../model/use-dashboard-editor';

const SUMMARY = {
  id: 'd'.repeat(43),
  title: 'Mon dashboard',
  description: '',
  tags: [],
  revision: 3,
  created_at: '',
  updated_at: '',
};

function wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  useDashboardStore.setState({
    layouts: {},
    activeId: null,
    draft: null,
    catalogOpen: false,
  });
  useLabStore.setState({ toast: null });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('useDashboardEditor', () => {
  it('saves the draft with the known revision', async () => {
    vi.spyOn(apiClient, 'getDashboards').mockResolvedValue({
      items: [SUMMARY],
    });
    vi.spyOn(apiClient, 'getDashboard').mockResolvedValue({
      ...SUMMARY,
      widgets: [],
      layout: [],
    });
    const put = vi
      .spyOn(apiClient, 'updateDashboardLayout')
      .mockResolvedValue({ ...SUMMARY, revision: 4, widgets: [], layout: [] });
    const { result } = renderHook(() => useDashboardEditor(), { wrapper });
    await waitFor(() => expect(result.current.active?.id).toBe(SUMMARY.id));

    act(() => result.current.start());
    act(() => result.current.remove('trades'));
    act(() => result.current.save());

    await waitFor(() => expect(result.current.editing).toBe(false));
    expect(put).toHaveBeenCalledWith(SUMMARY.id, { revision: 3, items: [] });
    expect(useDashboardStore.getState().layouts[SUMMARY.id]).toHaveLength(
      DEFAULT_DASHBOARD_LAYOUT.length - 1
    );
  });

  it('keeps editing and warns on a 409 conflict', async () => {
    const list = vi
      .spyOn(apiClient, 'getDashboards')
      .mockResolvedValue({ items: [SUMMARY] });
    vi.spyOn(apiClient, 'getDashboard').mockResolvedValue({
      ...SUMMARY,
      widgets: [],
      layout: [],
    });
    vi.spyOn(apiClient, 'updateDashboardLayout').mockRejectedValue(
      new ApiError(409, 'conflict', 'stale')
    );
    const { result } = renderHook(() => useDashboardEditor(), { wrapper });
    await waitFor(() => expect(result.current.active).not.toBeNull());

    act(() => result.current.start());
    act(() => result.current.save());

    await waitFor(() =>
      expect(useLabStore.getState().toast?.type).toBe('warning')
    );
    expect(result.current.editing).toBe(true);
    expect(list.mock.calls.length).toBeGreaterThan(1);
  });

  it('keeps the draft and exposes the error when the save fails', async () => {
    vi.spyOn(apiClient, 'getDashboards').mockResolvedValue({
      items: [SUMMARY],
    });
    vi.spyOn(apiClient, 'getDashboard').mockResolvedValue({
      ...SUMMARY,
      widgets: [],
      layout: [],
    });
    vi.spyOn(apiClient, 'updateDashboardLayout').mockRejectedValue(
      new ApiError(500, 'internal', 'boom')
    );
    const { result } = renderHook(() => useDashboardEditor(), { wrapper });
    await waitFor(() => expect(result.current.active).not.toBeNull());

    act(() => result.current.start());
    act(() => result.current.remove('trades'));
    act(() => result.current.save());

    await waitFor(() => expect(result.current.saveError).not.toBeNull());
    expect(result.current.editing).toBe(true);
    expect(result.current.dirty).toBe(true);

    act(() => result.current.cancel());
    expect(result.current.saveError).toBeNull();
  });

  it('creates a server dashboard on the first save', async () => {
    vi.spyOn(apiClient, 'getDashboards').mockResolvedValue({ items: [] });
    const create = vi
      .spyOn(apiClient, 'createDashboard')
      .mockResolvedValue({ ...SUMMARY, widgets: [], layout: [] });
    const { result } = renderHook(() => useDashboardEditor(), { wrapper });
    await waitFor(() => expect(apiClient.getDashboards).toHaveBeenCalled());

    act(() => result.current.start());
    act(() => result.current.save());

    await waitFor(() =>
      expect(useDashboardStore.getState().activeId).toBe(SUMMARY.id)
    );
    expect(create).toHaveBeenCalledWith({ title: 'Mon dashboard' });
  });
});
