'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type {
  ColorblindMode,
  ThemeMode,
  UserPreferencesState,
  UserSession,
  UserStore,
} from './types';
import { DEFAULT_USER_PREFERENCES } from './types';

export const USER_PREFERENCES_STORAGE_KEY = 'qslate_user_preferences';
const USER_PREFERENCES_STORAGE_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'dark' || value === 'light';
}

function isColorblindMode(value: unknown): value is ColorblindMode {
  return value === 'none' || value === 'orange-blue';
}

function sanitizePreferences(
  value: unknown,
  fallback: UserPreferencesState
): UserPreferencesState {
  if (!isRecord(value)) {
    return { ...fallback };
  }

  return {
    theme: isThemeMode(value.theme) ? value.theme : fallback.theme,
    colorblindMode: isColorblindMode(value.colorblindMode)
      ? value.colorblindMode
      : fallback.colorblindMode,
    sidebarCollapsed:
      typeof value.sidebarCollapsed === 'boolean'
        ? value.sidebarCollapsed
        : fallback.sidebarCollapsed,
  };
}

function selectPersistedPreferences({
  theme,
  colorblindMode,
  sidebarCollapsed,
}: UserStore): UserPreferencesState {
  return { theme, colorblindMode, sidebarCollapsed };
}

export const useUserStore = create<UserStore>()(
  devtools(
    persist<UserStore, [['zustand/devtools', never]], [], UserPreferencesState>(
      (set) => ({
        ...DEFAULT_USER_PREFERENCES,
        session: null,

        setTheme: (theme: ThemeMode) => set({ theme }, false, 'user/setTheme'),

        toggleTheme: () =>
          set(
            (state) => ({
              theme: state.theme === 'dark' ? 'light' : 'dark',
            }),
            false,
            'user/toggleTheme'
          ),

        setColorblindMode: (colorblindMode: ColorblindMode) =>
          set({ colorblindMode }, false, 'user/setColorblindMode'),

        toggleColorblindMode: () =>
          set(
            (state) => ({
              colorblindMode:
                state.colorblindMode === 'none' ? 'orange-blue' : 'none',
            }),
            false,
            'user/toggleColorblindMode'
          ),

        setSidebarCollapsed: (sidebarCollapsed: boolean) =>
          set({ sidebarCollapsed }, false, 'user/setSidebarCollapsed'),

        toggleSidebar: () =>
          set(
            (state) => ({
              sidebarCollapsed: !state.sidebarCollapsed,
            }),
            false,
            'user/toggleSidebar'
          ),

        resetPreferences: () =>
          set({ ...DEFAULT_USER_PREFERENCES }, false, 'user/resetPreferences'),

        setSession: (session: UserSession) =>
          set({ session }, false, 'user/setSession'),

        clearSession: () => set({ session: null }, false, 'user/clearSession'),
      }),
      {
        name: USER_PREFERENCES_STORAGE_KEY,
        version: USER_PREFERENCES_STORAGE_VERSION,
        partialize: selectPersistedPreferences,
        migrate: (persistedState) =>
          sanitizePreferences(persistedState, DEFAULT_USER_PREFERENCES),
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...sanitizePreferences(
            persistedState,
            selectPersistedPreferences(currentState)
          ),
        }),
      }
    ),
    { name: 'QSlateUserStore' }
  )
);

export const selectTheme = (state: UserStore): ThemeMode => state.theme;

export const selectColorblindMode = (state: UserStore): ColorblindMode =>
  state.colorblindMode;

export const selectSidebarCollapsed = (state: UserStore): boolean =>
  state.sidebarCollapsed;

export const selectSession = (state: UserStore): UserSession | null =>
  state.session;
