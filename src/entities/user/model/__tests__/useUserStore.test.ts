// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_USER_PREFERENCES,
  selectColorblindMode,
  selectSession,
  selectSidebarCollapsed,
  selectTheme,
  USER_PREFERENCES_STORAGE_KEY,
  useUserStore,
} from '../index';

describe('useUserStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useUserStore.getState().resetPreferences();
    useUserStore.getState().clearSession();
  });

  describe('initialization', () => {
    it('initializes with default preferences and no session', () => {
      const state = useUserStore.getState();

      expect(state.theme).toBe(DEFAULT_USER_PREFERENCES.theme);
      expect(state.colorblindMode).toBe(
        DEFAULT_USER_PREFERENCES.colorblindMode
      );
      expect(state.sidebarCollapsed).toBe(
        DEFAULT_USER_PREFERENCES.sidebarCollapsed
      );
      expect(state.session).toBeNull();
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

  describe('session actions', () => {
    it('sets and clears an opaque application session', () => {
      const session = {
        userId: 'user-123',
        expiresAt: '2026-10-14T00:00:00.000Z',
      };
      const { clearSession, setSession } = useUserStore.getState();

      setSession(session);
      expect(useUserStore.getState().session).toEqual(session);

      clearSession();
      expect(useUserStore.getState().session).toBeNull();
    });

    it('does not clear the session when resetting UI preferences', () => {
      const { resetPreferences, setSession, setTheme } =
        useUserStore.getState();
      const session = { userId: 'user-123' };

      setSession(session);
      setTheme('light');
      resetPreferences();

      expect(useUserStore.getState().theme).toBe('dark');
      expect(useUserStore.getState().session).toEqual(session);
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
      resetPreferences();

      expect(useUserStore.getState().theme).toBe('dark');
      expect(useUserStore.getState().colorblindMode).toBe('none');
      expect(useUserStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('persistence', () => {
    it('persists preferences but excludes session data', () => {
      const { setColorblindMode, setSession, setTheme } =
        useUserStore.getState();

      setTheme('light');
      setColorblindMode('orange-blue');
      setSession({ accessToken: 'must-not-be-persisted' });

      const rawStored = localStorage.getItem(USER_PREFERENCES_STORAGE_KEY);
      expect(rawStored).not.toBeNull();

      if (rawStored) {
        const parsed = JSON.parse(rawStored);
        expect(parsed.state.theme).toBe('light');
        expect(parsed.state.colorblindMode).toBe('orange-blue');
        expect(parsed.state.session).toBeUndefined();
        expect(parsed.state.accessToken).toBeUndefined();
      }
    });
  });

  describe('selectors', () => {
    it('extracts state values atomically via selectors', () => {
      const session = { userId: 'user-123' };
      useUserStore.getState().setSession(session);
      const state = useUserStore.getState();

      expect(selectTheme(state)).toBe('dark');
      expect(selectColorblindMode(state)).toBe('none');
      expect(selectSidebarCollapsed(state)).toBe(false);
      expect(selectSession(state)).toEqual(session);
    });
  });
});
