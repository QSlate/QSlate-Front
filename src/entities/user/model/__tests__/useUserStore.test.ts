// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_USER_PREFERENCES,
  selectColorblindMode,
  selectSidebarCollapsed,
  selectTheme,
  USER_PREFERENCES_STORAGE_KEY,
  useUserStore,
} from '../index';

describe('useUserStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useUserStore.getState().resetPreferences();
  });

  describe('initialization', () => {
    it('initializes with default preferences', () => {
      const state = useUserStore.getState();
      expect(state.theme).toBe(DEFAULT_USER_PREFERENCES.theme);
      expect(state.colorblindMode).toBe(
        DEFAULT_USER_PREFERENCES.colorblindMode
      );
      expect(state.sidebarCollapsed).toBe(
        DEFAULT_USER_PREFERENCES.sidebarCollapsed
      );
    });
  });

  describe('theme actions', () => {
    it('sets theme explicitly', () => {
      const { setTheme } = useUserStore.getState();

      setTheme('light');
      expect(useUserStore.getState().theme).toBe('light');

      setTheme('dark');
      expect(useUserStore.getState().theme).toBe('dark');
    });

    it('toggles theme between dark and light', () => {
      const { toggleTheme } = useUserStore.getState();

      expect(useUserStore.getState().theme).toBe('dark');

      toggleTheme();
      expect(useUserStore.getState().theme).toBe('light');

      toggleTheme();
      expect(useUserStore.getState().theme).toBe('dark');
    });
  });

  describe('colorblind mode actions', () => {
    it('sets colorblind mode explicitly', () => {
      const { setColorblindMode } = useUserStore.getState();

      setColorblindMode('orange-blue');
      expect(useUserStore.getState().colorblindMode).toBe('orange-blue');

      setColorblindMode('none');
      expect(useUserStore.getState().colorblindMode).toBe('none');
    });

    it('toggles colorblind mode between none and orange-blue', () => {
      const { toggleColorblindMode } = useUserStore.getState();

      expect(useUserStore.getState().colorblindMode).toBe('none');

      toggleColorblindMode();
      expect(useUserStore.getState().colorblindMode).toBe('orange-blue');

      toggleColorblindMode();
      expect(useUserStore.getState().colorblindMode).toBe('none');
    });
  });

  describe('sidebar actions', () => {
    it('sets sidebar collapsed explicitly', () => {
      const { setSidebarCollapsed } = useUserStore.getState();

      setSidebarCollapsed(true);
      expect(useUserStore.getState().sidebarCollapsed).toBe(true);

      setSidebarCollapsed(false);
      expect(useUserStore.getState().sidebarCollapsed).toBe(false);
    });

    it('toggles sidebar state', () => {
      const { toggleSidebar } = useUserStore.getState();

      expect(useUserStore.getState().sidebarCollapsed).toBe(false);

      toggleSidebar();
      expect(useUserStore.getState().sidebarCollapsed).toBe(true);

      toggleSidebar();
      expect(useUserStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('resetPreferences', () => {
    it('restores all preferences back to defaults', () => {
      const {
        setTheme,
        setColorblindMode,
        setSidebarCollapsed,
        resetPreferences,
      } = useUserStore.getState();

      setTheme('light');
      setColorblindMode('orange-blue');
      setSidebarCollapsed(true);

      expect(useUserStore.getState().theme).toBe('light');
      expect(useUserStore.getState().colorblindMode).toBe('orange-blue');
      expect(useUserStore.getState().sidebarCollapsed).toBe(true);

      resetPreferences();

      expect(useUserStore.getState().theme).toBe('dark');
      expect(useUserStore.getState().colorblindMode).toBe('none');
      expect(useUserStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('persistence', () => {
    it('persists preferences state changes into localStorage', () => {
      const { setTheme, setColorblindMode } = useUserStore.getState();

      setTheme('light');
      setColorblindMode('orange-blue');

      const rawStored = localStorage.getItem(USER_PREFERENCES_STORAGE_KEY);
      expect(rawStored).not.toBeNull();

      if (rawStored) {
        const parsed = JSON.parse(rawStored);
        expect(parsed.state.theme).toBe('light');
        expect(parsed.state.colorblindMode).toBe('orange-blue');
      }
    });
  });

  describe('selectors', () => {
    it('extracts state values atomically via selectors', () => {
      const state = useUserStore.getState();

      expect(selectTheme(state)).toBe('dark');
      expect(selectColorblindMode(state)).toBe('none');
      expect(selectSidebarCollapsed(state)).toBe(false);
    });
  });
});
