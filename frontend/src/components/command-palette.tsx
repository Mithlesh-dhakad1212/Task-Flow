'use client';

import {
  CheckSquare,
  CornerDownLeft,
  FolderKanban,
  FolderPlus,
  LayoutDashboard,
  type LucideIcon,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Kbd, StatusPill } from '@/components/tasks/task-bits';
import { useTheme } from '@/context/theme-context';
import { useUI } from '@/context/ui-context';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useProjectOptions } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { PROJECT_COLORS } from '@/lib/constants';
import { type TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
  group: 'Actions' | 'Navigate' | 'Projects' | 'Tasks';
  label: string;
  hint?: string;
  icon?: LucideIcon;
  dot?: string;
  status?: TaskStatus;
  run: () => void;
}

/** Filters items whose label contains every word of the query (case-insensitive). */
export function matches(label: string, query: string): boolean {
  const hay = label.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}

export function CommandPalette() {
  const ui = useUI();
  if (!ui.paletteOpen || typeof document === 'undefined') return null;
  return createPortal(<Palette onClose={() => ui.setPaletteOpen(false)} />, document.body);
}

function Palette({ onClose }: { onClose: () => void }) {
  const ui = useUI();
  const router = useRouter();
  const { isDark, toggle } = useTheme();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebouncedValue(query.trim(), 200);
  const projects = useProjectOptions();
  const tasks = useTasks({ search: debounced, limit: 6, sortBy: 'updatedAt', order: 'desc' }, { enabled: debounced.length > 0 });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => {
      onClose();
      router.push(href);
    };
    const base: Item[] = [
      {
        id: 'new-task',
        group: 'Actions',
        label: 'Create task',
        hint: 'N',
        icon: Plus,
        run: () => {
          onClose();
          ui.openCreateTask();
        },
      },
      {
        id: 'new-project',
        group: 'Actions',
        label: 'Create project',
        hint: 'P',
        icon: FolderPlus,
        run: () => {
          onClose();
          ui.openCreateProject();
        },
      },
      {
        id: 'theme',
        group: 'Actions',
        label: isDark ? 'Switch to light mode' : 'Switch to dark mode',
        icon: isDark ? Sun : Moon,
        run: () => {
          toggle();
          onClose();
        },
      },
      { id: 'nav-dashboard', group: 'Navigate', label: 'Go to Dashboard', icon: LayoutDashboard, run: go('/dashboard') },
      { id: 'nav-tasks', group: 'Navigate', label: 'Go to My Tasks', icon: CheckSquare, run: go('/tasks') },
      { id: 'nav-overdue', group: 'Navigate', label: 'Show overdue tasks', icon: CheckSquare, run: go('/tasks?overdue=1&view=list') },
      { id: 'nav-projects', group: 'Navigate', label: 'Go to Projects', icon: FolderKanban, run: go('/projects') },
      { id: 'nav-settings', group: 'Navigate', label: 'Go to Settings', icon: Settings, run: go('/settings') },
      ...(projects.data?.data ?? []).map<Item>((p) => ({
        id: `project-${p.id}`,
        group: 'Projects',
        label: p.name,
        hint: `${p.stats.progress}%`,
        dot: PROJECT_COLORS[p.color]?.swatch,
        run: go(`/projects/${p.id}`),
      })),
    ];
    const all = base.filter((i) => !query.trim() || matches(i.label, query));

    const taskItems: Item[] = debounced
      ? (tasks.data?.data ?? []).map((t) => ({
          id: `task-${t.id}`,
          group: 'Tasks',
          label: t.title,
          hint: t.project.name,
          status: t.status,
          run: () => {
            onClose();
            ui.openTask(t.id);
          },
        }))
      : [];
    return [...all.slice(0, query ? 8 : 20), ...taskItems];
  }, [query, debounced, projects.data, tasks.data, isDark, toggle, onClose, router, ui]);

  useEffect(() => setActive(0), [query, items.length]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[active]?.run();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, listId]);

  let lastGroup = '';
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-ink-200 bg-elevated shadow-lift"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-ink-100 px-4">
          <Search className="h-5 w-5 text-ink-400" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, projects or actions…"
            className="h-14 flex-1 bg-transparent text-base text-ink-900 outline-none placeholder:text-ink-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={items.length ? `${listId}-${active}` : undefined}
            aria-autocomplete="list"
          />
          <Kbd>Esc</Kbd>
        </div>

        <ul id={listId} role="listbox" className="max-h-[50vh] overflow-y-auto p-2 scrollbar-thin">
          {items.map((item, index) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <li key={item.id} role="presentation">
                {header && (
                  <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400 first:pt-1">
                    {header}
                  </p>
                )}
                <div
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseMove={() => setActive(index)}
                  onClick={item.run}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm',
                    index === active ? 'bg-brand-500/10 text-ink-900' : 'text-ink-700',
                  )}
                >
                  {item.icon && <item.icon className="h-4 w-4 text-ink-400" aria-hidden />}
                  {item.dot && <span className={cn('h-2.5 w-2.5 rounded-[4px]', item.dot)} aria-hidden />}
                  {item.status && <StatusPill status={item.status} />}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="shrink-0 text-xs text-ink-400">{item.hint}</span>}
                  {index === active && <CornerDownLeft className="h-3.5 w-3.5 text-ink-400" aria-hidden />}
                </div>
              </li>
            );
          })}
          {items.length === 0 && !tasks.isFetching && (
            <li className="px-3 py-10 text-center text-sm text-ink-500">No results for “{query}”</li>
          )}
          {debounced && tasks.isFetching && (
            <li className="px-3 py-2 text-xs text-ink-400">Searching tasks…</li>
          )}
        </ul>

        <div className="flex items-center gap-4 border-t border-ink-100 px-4 py-2 text-[11px] text-ink-400">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> open
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Kbd>N</Kbd> new task · <Kbd>P</Kbd> new project · <Kbd>/</Kbd> search
          </span>
        </div>
      </div>
    </div>
  );
}
