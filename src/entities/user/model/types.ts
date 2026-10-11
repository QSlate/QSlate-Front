export type ThemeMode = 'dark' | 'light';

export type ColorblindMode = 'none' | 'orange-blue';

export interface UserPreferencesState {
  theme: ThemeMode;
  colorblindMode: ColorblindMode;
  sidebarCollapsed: boolean;
}

export interface UserPreferencesActions {
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setColorblindMode: (mode: ColorblindMode) => void;
  toggleColorblindMode: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  resetPreferences: () => void;
}

export type UserStore = UserPreferencesState & UserPreferencesActions;

export const DEFAULT_USER_PREFERENCES: UserPreferencesState = {
  theme: 'dark',
  colorblindMode: 'none',
  sidebarCollapsed: false,
};
