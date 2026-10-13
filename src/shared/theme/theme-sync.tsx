'use client';

import { useEffect } from 'react';

import {
  selectTheme,
  type ThemeMode,
  type UserStore,
  useUserStore,
} from '@/entities/user/model';
import { useHydratedStore } from '@/shared/lib/store';

export function ThemeSync() {
  const theme = useHydratedStore<UserStore, ThemeMode>(
    useUserStore,
    selectTheme,
    'dark'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return null;
}
