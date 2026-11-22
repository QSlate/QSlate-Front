'use client';

import { type ReactNode, useEffect, useMemo, useRef } from 'react';

import {
  DEFAULT_USER_PREFERENCES,
  selectColorblindMode,
  useAuthStore,
  useUserStore,
  useUserTheme,
} from '@/entities/user/model';
import { apiClient } from '@/shared/api';
import { useHydratedStore } from '@/shared/lib/store';
import {
  AppearanceProvider,
  type ColorblindMode,
  type ThemeMode,
} from '@/shared/theme';

export function ThemeSync({ children }: { children?: ReactNode }) {
  const theme = useUserTheme();
  const colorblindMode = useHydratedStore(
    useUserStore,
    selectColorblindMode,
    DEFAULT_USER_PREFERENCES.colorblindMode
  );
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);

  const appearance = useMemo(
    () => ({ theme, colorblindMode }),
    [theme, colorblindMode]
  );

  const lastSyncedRef = useRef<{
    theme: ThemeMode;
    colorblindMode: ColorblindMode;
  } | null>(null);

  const isInitialMount = useRef(true);

  // Mirror appearance preferences on <html> so design tokens apply globally.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (colorblindMode === 'none') {
      delete root.dataset.colorblind;
    } else {
      root.dataset.colorblind = colorblindMode;
    }
  }, [colorblindMode]);

  // Hydrate preferences on login / mount
  useEffect(() => {
    if (!isAuthenticated) {
      lastSyncedRef.current = null;
      return;
    }

    let isSubscribed = true;
    apiClient
      .getUserPreferences(accessToken ?? undefined)
      .then((remote) => {
        if (!isSubscribed) return;
        const remoteTheme: ThemeMode =
          remote.theme === 'light' || remote.theme === 'dark'
            ? remote.theme
            : 'dark';
        const remoteColorblind: ColorblindMode = remote.colorblind_mode
          ? 'orange-blue'
          : 'none';

        lastSyncedRef.current = {
          theme: remoteTheme,
          colorblindMode: remoteColorblind,
        };

        useUserStore.getState().hydrateRemotePreferences(remote);
      })
      .catch(() => {
        // Ignore remote preference load errors
      });

    return () => {
      isSubscribed = false;
    };
  }, [isAuthenticated, accessToken]);

  // Debounce sync local changes to remote backend
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!isAuthenticated) return;

    // Check if change actually differs from what is synced
    if (
      lastSyncedRef.current &&
      lastSyncedRef.current.theme === theme &&
      lastSyncedRef.current.colorblindMode === colorblindMode
    ) {
      return;
    }

    const timer = setTimeout(() => {
      apiClient
        .updateUserPreferences(
          {
            theme,
            colorblind_mode: colorblindMode === 'orange-blue',
          },
          accessToken ?? undefined
        )
        .then(() => {
          lastSyncedRef.current = { theme, colorblindMode };
        })
        .catch(() => {
          // Ignore network errors on preference sync
        });
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [theme, colorblindMode, isAuthenticated, accessToken]);

  return <AppearanceProvider value={appearance}>{children}</AppearanceProvider>;
}
