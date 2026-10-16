'use client';

import {
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Kbd } from '@/components/tasks/task-bits';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { useUI } from '@/context/ui-context';
import { useProjects } from '@/hooks/use-projects';
import { PROJECT_COLORS } from '@/lib/constants';
import { cn, initials } from '@/lib/utils';
import { Logo } from './logo';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'My Tasks', icon: CheckSquare },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const SIDEBAR_PROJECTS = 8;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const ui = useUI();
  const projects = useProjects({ sortBy: 'updatedAt', order: 'desc', limit: SIDEBAR_PROJECTS });

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col border-r border-ink-200/70 bg-surface">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <Logo />
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <div className="space-y-2 px-3">
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            ui.setPaletteOpen(true);
          }}
          className="flex h-9 w-full items-center gap-2 rounded-lg bg-ink-100/70 px-3 text-sm text-ink-500 ring-1 ring-inset ring-ink-200/60 transition hover:bg-ink-100 hover:text-ink-700"
        >
          <Search className="h-4 w-4" aria-hidden />
          <span className="flex-1 text-left">Search…</span>
          <Kbd>⌘K</Kbd>
        </button>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            ui.openCreateTask();
          }}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-brand-gradient text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" aria-hidden /> New task
          <Kbd className="border-white/30 bg-white/15 text-white">N</Kbd>
        </button>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto px-3 scrollbar-thin" aria-label="Main">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href) && !(href === '/projects' && pathname !== '/projects');
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                    active
                      ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300'
                      : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mb-1 mt-6 flex items-center justify-between px-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Projects</p>
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              ui.openCreateProject();
            }}
            className="rounded p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            aria-label="New project"
            title="New project"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <ul className="space-y-0.5 pb-4">
          {projects.data?.data.map((p) => {
            const href = `/projects/${p.id}`;
            const active = pathname === href;
            return (
              <li key={p.id}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition',
                    active ? 'bg-ink-100 font-medium text-ink-900' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                  )}
                >
                  <span className={cn('h-2.5 w-2.5 shrink-0 rounded-[4px]', PROJECT_COLORS[p.color]?.swatch)} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="text-[11px] tabular-nums text-ink-400">{p.stats.total - p.stats.done || ''}</span>
                </Link>
              </li>
            );
          })}
          {projects.data && projects.data.data.length === 0 && (
            <li className="px-3 py-1.5 text-xs text-ink-400">No projects yet</li>
          )}
          {projects.data && projects.data.meta.total > SIDEBAR_PROJECTS && (
            <li>
              <Link href="/projects" onClick={onNavigate} className="block px-3 py-1.5 text-xs font-medium text-brand-600 hover:underline">
                View all {projects.data.meta.total}
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {user && (
        <div className="border-t border-ink-200/70 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
              <p className="truncate text-xs text-ink-500">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-900"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
