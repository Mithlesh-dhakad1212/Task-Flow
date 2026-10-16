'use client';

import { useEffect, useRef } from 'react';

export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

type Handlers = Record<string, (e: KeyboardEvent) => void>;

/**
 * Global keyboard shortcuts. Keys are either "mod+k" (⌘ on macOS, Ctrl
 * elsewhere) or a single lowercase key, which is ignored while the user is
 * typing or while a dialog is open.
 */
export function useHotkeys(handlers: Handlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        ref.current[`mod+${key}`]?.(e);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const handler = ref.current[key];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
