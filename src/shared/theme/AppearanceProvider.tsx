'use client';

import { createContext, type ReactNode, useContext } from 'react';

import type { Appearance } from './types';

const AppearanceContext = createContext<Appearance>({
  theme: 'dark',
  colorblindMode: 'none',
});

export function AppearanceProvider({
  value,
  children,
}: {
  value: Appearance;
  children: ReactNode;
}) {
  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): Appearance {
  return useContext(AppearanceContext);
}
