'use client';

import { Menu, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { CommandPalette } from '@/components/command-palette';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import { TaskDrawerHost } from '@/components/tasks/task-drawer';
import { TaskFormDialog } from '@/components/tasks/task-form-dialog';
import { useUI } from '@/context/ui-context';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { Logo } from './logo';
import { Sidebar } from './sidebar';

/** Fixed sidebar on desktop; slide-in drawer on small screens; global overlays. */
export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const ui = useUI();

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  useHotkeys({
    'mod+k': (e) => {
      e.preventDefault();
      ui.setPaletteOpen(!ui.paletteOpen);
    },
    n: () => ui.openCreateTask(),
    p: () => ui.openCreateProject(),
    '/': () => document.querySelector<HTMLInputElement>('[data-search-input]')?.focus(),
  });

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-surface px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={() => setDrawerOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] animate-slide-in shadow-lift">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-ink-200/70 bg-surface/90 px-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-2 text-ink-600 hover:bg-ink-100"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo className="flex-1" />
          <button
            type="button"
            onClick={() => ui.setPaletteOpen(true)}
            className="rounded-md p-2 text-ink-600 hover:bg-ink-100"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      {/* Global overlays */}
      <Suspense>
        <TaskDrawerHost />
      </Suspense>
      <TaskFormDialog
        open={ui.createTask.open}
        defaultProjectId={ui.createTask.defaults.projectId}
        defaultStatus={ui.createTask.defaults.status}
        defaultPriority={ui.createTask.defaults.priority}
        onClose={ui.closeCreateTask}
      />
      <ProjectFormDialog open={ui.createProjectOpen} onClose={ui.closeCreateProject} />
      <CommandPalette />
    </div>
  );
}
