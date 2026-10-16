'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { type TaskPriority, type TaskStatus } from '@/lib/types';

export interface NewTaskDefaults {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

interface UIContextValue {
  /** Open the task side panel (deep-linkable via ?task=<id>). */
  openTask: (id: string) => void;
  closeTask: () => void;
  createTask: { open: boolean; defaults: NewTaskDefaults };
  openCreateTask: (defaults?: NewTaskDefaults) => void;
  closeCreateTask: () => void;
  createProjectOpen: boolean;
  openCreateProject: () => void;
  closeCreateProject: () => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

/**
 * App-wide overlays (task drawer, create dialogs, command palette) are
 * rendered once in the shell and opened from anywhere through this context,
 * so every page, the palette and keyboard shortcuts share one implementation.
 */
export function UIProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [createTask, setCreateTask] = useState<{ open: boolean; defaults: NewTaskDefaults }>({
    open: false,
    defaults: {},
  });
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const setTaskParam = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(window.location.search);
      if (id) params.set('task', id);
      else params.delete('task');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const value = useMemo<UIContextValue>(
    () => ({
      openTask: (id) => setTaskParam(id),
      closeTask: () => setTaskParam(null),
      createTask,
      openCreateTask: (defaults = {}) => setCreateTask({ open: true, defaults }),
      closeCreateTask: () => setCreateTask((s) => ({ ...s, open: false })),
      createProjectOpen,
      openCreateProject: () => setCreateProjectOpen(true),
      closeCreateProject: () => setCreateProjectOpen(false),
      paletteOpen,
      setPaletteOpen,
    }),
    [setTaskParam, createTask, createProjectOpen, paletteOpen],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>');
  return ctx;
}
