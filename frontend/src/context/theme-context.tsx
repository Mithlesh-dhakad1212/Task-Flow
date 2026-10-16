'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ACCENT_STORAGE_KEY,
  type Accent,
  isAccent,
  isThemeMode,
  resolveDark,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from '@/lib/theme';

interface ThemeContextValue {
  mode: ThemeMode;
  accent: Accent;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: Accent) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function read<T>(key: string, guard: (v: unknown) => v is T, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return guard(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode / blocked storage: the choice still applies for this visit.
  }
}

/**
 * Light / dark / system mode plus an accent colour. A per-browser preference,
 * so it lives in localStorage; the inline boot script applies it before paint.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Lazy initialisers read the same values the boot script applied, so the
  // first client render agrees with the DOM and nothing flips after mount.
  // (Theme-dependent UI only renders behind the auth gate, never in SSR HTML.)
  const isBrowser = typeof window !== 'undefined';
  const [mode, setModeState] = useState<ThemeMode>(() =>
    isBrowser ? read(THEME_STORAGE_KEY, isThemeMode, 'system') : 'system',
  );
  const [accent, setAccentState] = useState<Accent>(() =>
    isBrowser ? read(ACCENT_STORAGE_KEY, isAccent, 'violet') : 'violet',
  );
  const [systemDark, setSystemDark] = useState(
    () => isBrowser && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const isDark = resolveDark(mode, systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
  }, [accent]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    write(THEME_STORAGE_KEY, next);
  }, []);

  const setAccent = useCallback((next: Accent) => {
    setAccentState(next);
    write(ACCENT_STORAGE_KEY, next);
  }, []);

  const toggle = useCallback(() => setMode(isDark ? 'light' : 'dark'), [isDark, setMode]);

  const value = useMemo(
    () => ({ mode, accent, isDark, setMode, setAccent, toggle }),
    [mode, accent, isDark, setMode, setAccent, toggle],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
