// @vitest-environment jsdom
import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLabStore } from '../model/useLabStore';

describe('useLabStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useLabStore.setState({
      toast: null,
      isExecutionLogsOpen: false,
    });
  });

  afterEach(() => vi.useRealTimers());

  it('shows a toast then clears it after a delay', () => {
    act(() => useLabStore.getState().showToast('Enregistré'));
    expect(useLabStore.getState().toast?.message).toBe('Enregistré');
    act(() => vi.advanceTimersByTime(3_600));
    expect(useLabStore.getState().toast).toBeNull();
  });

  it('toggles the logs console', () => {
    act(() => useLabStore.getState().toggleExecutionLogs());
    expect(useLabStore.getState().isExecutionLogsOpen).toBe(true);
  });
});
