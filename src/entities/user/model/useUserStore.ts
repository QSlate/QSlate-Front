import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type { ColorblindMode, ThemeMode, UserStore } from './types';
import { DEFAULT_USER_PREFERENCES } from './types';

export const USER_PREFERENCES_STORAGE_KEY = 'qslate_user_preferences';

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set) => ({
        ...DEFAULT_USER_PREFERENCES,

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
      }),
      {
        name: USER_PREFERENCES_STORAGE_KEY,
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
