export type ThemeMode = 'light' | 'dark' | 'system';
export type Accent = 'violet' | 'blue' | 'emerald' | 'rose' | 'amber';

export const ACCENTS: { id: Accent; label: string; swatch: string }[] = [
  { id: 'violet', label: 'Violet', swatch: '#7c3aed' },
  { id: 'blue', label: 'Ocean', swatch: '#2563eb' },
  { id: 'emerald', label: 'Forest', swatch: '#047857' },
  { id: 'rose', label: 'Rose', swatch: '#e11d48' },
  { id: 'amber', label: 'Sunset', swatch: '#b45309' },
];

export const THEME_STORAGE_KEY = 'taskflow:theme';
export const ACCENT_STORAGE_KEY = 'taskflow:accent';

export function isAccent(value: unknown): value is Accent {
  return ACCENTS.some((a) => a.id === value);
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** Whether `mode` resolves to dark, given the OS preference. */
export function resolveDark(mode: ThemeMode, systemPrefersDark: boolean): boolean {
  return mode === 'dark' || (mode === 'system' && systemPrefersDark);
}

/**
 * Runs before React hydrates (inlined in <head>) so the first paint already
 * has the right theme — no light-mode flash for dark-mode users.
 */
export const themeBootScript = `(function(){try{var d=document.documentElement;var m=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';var a=localStorage.getItem('${ACCENT_STORAGE_KEY}')||'violet';var dark=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);d.classList.toggle('dark',dark);d.setAttribute('data-accent',a);}catch(e){}})();`;
