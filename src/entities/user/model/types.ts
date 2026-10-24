import type { ThemeMode } from '@/shared/theme/types';

export type { ThemeMode } from '@/shared/theme/types';

export type ColorblindMode = 'none' | 'orange-blue';

export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
  display_name: string;
  email_verified: boolean;
  name?: string;
  role?: string;
}

export interface AuthSession {
  user: User;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export type UserSession = User | Readonly<Record<string, unknown>>;

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
  setSession: (session: UserSession) => void;
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
