'use client';

import { useEffect } from 'react';

import { useUserTheme } from '@/entities/user/model';

export function ThemeSync() {
  const theme = useUserTheme();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return null;
}
