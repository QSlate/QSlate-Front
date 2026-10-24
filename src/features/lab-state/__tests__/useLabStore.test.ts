// @vitest-environment jsdom
import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLabStore } from '../model/useLabStore';

describe('useLabStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useLabStore.setState({
      activeTab: 'workspace',
      isAddWidgetDrawerOpen: false,
      ideActiveFile: 'strategy.py',
      ideAstStatus: 'valid',
      marketplaceSearch: '',
      marketplaceCategory: 'All',
      toast: null,
    });
  });

  it('toggles the Add Widget drawer', () => {
    expect(useLabStore.getState().isAddWidgetDrawerOpen).toBe(false);
    act(() => {
      useLabStore.getState().toggleAddWidgetDrawer();
    });
    expect(useLabStore.getState().isAddWidgetDrawerOpen).toBe(true);
    act(() => {
      useLabStore.getState().toggleAddWidgetDrawer();
    });
    expect(useLabStore.getState().isAddWidgetDrawerOpen).toBe(false);
  });

  it('updates ide files and resets AST status', () => {
    act(() => {
      useLabStore
        .getState()
        .updateIdeFileContent('strategy.py', '# Updated code');
    });
    expect(useLabStore.getState().ideFiles['strategy.py']).toBe(
      '# Updated code'
    );
    expect(useLabStore.getState().ideAstStatus).toBe('valid');
  });

  it('handles marketplace search and category filtering', () => {
    act(() => {
      useLabStore.getState().setMarketplaceSearch('Monte Carlo');
      useLabStore.getState().setMarketplaceCategory('Risk Analytics');
    });
    expect(useLabStore.getState().marketplaceSearch).toBe('Monte Carlo');
    expect(useLabStore.getState().marketplaceCategory).toBe('Risk Analytics');
  });

  it('shows and automatically dismisses toast notifications', () => {
    act(() => {
      useLabStore.getState().showToast('Test notification', 'success');
    });
    expect(useLabStore.getState().toast?.message).toBe('Test notification');

    act(() => {
      vi.advanceTimersByTime(3600);
    });
    expect(useLabStore.getState().toast).toBeNull();
  });
});
