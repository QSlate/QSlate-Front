'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { apiClient } from '@/shared/api';

import {
  clearAuthCookies,
  getAuthTokenFromCookie,
  getAuthUserFromCookie,
  setAuthCookies,
} from '../lib/cookies';
import type { AuthSession, User } from './types';
import { useUserStore } from './useUserStore';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthActions {
  setAuth: (session: AuthSession) => void;
  updateUser: (patch: Partial<User>) => void;
  clearAuth: () => void;
  initializeAuth: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;

export const AUTH_STORAGE_KEY = 'qslate_auth_session';

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist<AuthStore, [['zustand/devtools', never]], [], AuthState>(
      (set, get) => ({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: true,

        setAuth: (session: AuthSession) => {
          setAuthCookies(session);
          useUserStore.getState().setSession(session.user);

          set(
            {
              user: session.user,
              accessToken: session.access_token,
              isAuthenticated: true,
              isLoading: false,
            },
            false,
            'auth/setAuth'
          );
        },

        updateUser: (patch: Partial<User>) => {
          const current = get().user;
          if (!current) return;
          const updated = { ...current, ...patch };
          const token = get().accessToken;

          if (token) {
            setAuthCookies({
              user: updated,
              access_token: token,
              token_type: 'Bearer',
              expires_in: 86400 * 30,
            });
          }
          useUserStore.getState().setSession(updated);

          set({ user: updated }, false, 'auth/updateUser');
        },

        clearAuth: () => {
          clearAuthCookies();
          useUserStore.getState().clearSession();

          set(
            {
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
            },
            false,
            'auth/clearAuth'
          );
        },

        initializeAuth: async () => {
          set({ isLoading: true }, false, 'auth/initialize:start');

          const cookieToken = getAuthTokenFromCookie();
          const cookieUser = getAuthUserFromCookie();

          if (cookieToken) {
            set(
              {
                accessToken: cookieToken,
                user: cookieUser ?? get().user,
                isAuthenticated: true,
                isLoading: false,
              },
              false,
              'auth/initialize:restored'
            );

            try {
              const { user: remoteUser } = await apiClient.getMe(cookieToken);
              get().updateUser(remoteUser);
            } catch {
              // Token might be invalid or network error
            }
          } else {
            set(
              {
                user: null,
                accessToken: null,
                isAuthenticated: false,
                isLoading: false,
              },
              false,
              'auth/initialize:empty'
            );
          }
        },
      }),
      {
        name: AUTH_STORAGE_KEY,
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          isAuthenticated: state.isAuthenticated,
          isLoading: false,
        }),
      }
    ),
    { name: 'QSlateAuthStore' }
  )
);

// Wire API client token injection to auth store
apiClient.setTokenProvider(() => useAuthStore.getState().accessToken);
