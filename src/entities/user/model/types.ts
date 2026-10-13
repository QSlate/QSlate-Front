export type ThemeMode = 'dark' | 'light';

export type ColorblindMode = 'none' | 'orange-blue';

export type UserSession = Readonly<Record<string, unknown>>;

export interface UserPreferencesState {
  theme: ThemeMode;
  colorblindMode: ColorblindMode;
  sidebarCollapsed: boolean;
}

export interface UserSessionState {
  session: UserSession | null;
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

export interface UserSessionActions {
  setSession: (session: UserSession | null) => void;
  clearSession: () => void;
}

export type UserStore = UserPreferencesState &
  UserSessionState &
  UserPreferencesActions &
  UserSessionActions;

export const DEFAULT_USER_PREFERENCES: UserPreferencesState = {
  theme: 'dark',
  colorblindMode: 'none',
  sidebarCollapsed: false,
};
