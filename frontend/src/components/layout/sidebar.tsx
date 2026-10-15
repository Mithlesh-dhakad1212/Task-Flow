'use client';

import { CheckSquare, FolderKanban, LayoutDashboard, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { cn, initials } from '@/lib/utils';
import { Logo } from './logo';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col bg-ink-900 text-ink-300">
      <div className="px-5 py-5">
        <Logo />
      </div>

      <nav className="flex-1 px-3" aria-label="Main">
        <p className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-widest text-ink-500">Workspace</p>
        <ul className="space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                    active ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white',
                  )}
                >
                  {active && <span className="absolute inset-y-1.5 left-0 w-1 rounded-r bg-brand-400" aria-hidden />}
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {user && (
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-200">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-ink-400">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md p-2 text-ink-400 transition hover:bg-white/10 hover:text-white"
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
