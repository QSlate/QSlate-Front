'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'qslate-theme';

let listeners: Array<() => void> = [];

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

function getThemeSnapshot(): Theme {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

function getServerSnapshot(): Theme {
  return 'dark';
}

function subscribe(callback: () => void): () => void {
  listeners.push(callback);
  window.addEventListener('storage', callback);
  const media = window.matchMedia('(prefers-color-scheme: light)');
  media.addEventListener('change', callback);

  return () => {
    listeners = listeners.filter((l) => l !== callback);
    window.removeEventListener('storage', callback);
    media.removeEventListener('change', callback);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    localStorage.setItem(STORAGE_KEY, nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    notifyListeners();
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
