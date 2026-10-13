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

        setSession: (session: UserSession | null) =>
          set({ session }, false, 'user/setSession'),

        clearSession: () => set({ session: null }, false, 'user/clearSession'),
      }),
      {
        name: USER_PREFERENCES_STORAGE_KEY,
        partialize: ({ theme, colorblindMode, sidebarCollapsed }) => ({
          theme,
          colorblindMode,
          sidebarCollapsed,
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
