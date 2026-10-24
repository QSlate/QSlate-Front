'use client';

import { type ReactNode, useEffect, useMemo } from 'react';

import {
  DEFAULT_USER_PREFERENCES,
  selectColorblindMode,
  useUserStore,
  useUserTheme,
} from '@/entities/user/model';
import { useHydratedStore } from '@/shared/lib/store';
import { AppearanceProvider } from '@/shared/theme';

export function ThemeSync({ children }: { children?: ReactNode }) {
  const theme = useUserTheme();
  const colorblindMode = useHydratedStore(
    useUserStore,
    selectColorblindMode,
    DEFAULT_USER_PREFERENCES.colorblindMode
  );
  const appearance = useMemo(
    () => ({ theme, colorblindMode }),
    [theme, colorblindMode]
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return <AppearanceProvider value={appearance}>{children}</AppearanceProvider>;
}
