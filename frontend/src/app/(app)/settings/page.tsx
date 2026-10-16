'use client';

import { Check, Keyboard, LogOut, Monitor, Moon, ShieldCheck, Sun } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Kbd } from '@/components/tasks/task-bits';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { ACCENTS, type ThemeMode } from '@/lib/theme';
import { cn, initials } from '@/lib/utils';

const MODES: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

const SHORTCUTS: [string[], string][] = [
  [['⌘', 'K'], 'Open the command palette (Ctrl+K on Windows/Linux)'],
  [['N'], 'Create a task'],
  [['P'], 'Create a project'],
  [['/'], 'Focus the search box'],
  [['Esc'], 'Close the open panel or dialog'],
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { mode, setMode, accent, setAccent } = useTheme();
  if (!user) return null;

  return (
    <>
      <PageHeader title="Settings" description="Your profile, appearance and session." />
      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardHeader title="Profile" />
          <div className="flex items-center gap-4 p-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-lg font-bold text-white">
              {initials(user.name)}
            </span>
            <dl className="grid gap-0.5 text-sm">
              <dt className="sr-only">Name</dt>
              <dd className="font-semibold text-ink-900">{user.name}</dd>
              <dt className="sr-only">Email</dt>
              <dd className="text-ink-600">{user.email}</dd>
              <dt className="sr-only">Member since</dt>
              <dd className="text-xs text-ink-400">
                Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </dd>
            </dl>
          </div>
        </Card>

        <Card>
          <CardHeader title="Appearance" subtitle="Saved in this browser." />
          <div className="space-y-6 p-5">
            <fieldset>
              <legend className="mb-2.5 text-sm font-medium text-ink-800">Theme</legend>
              <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Theme">
                {MODES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={mode === id}
                    onClick={() => setMode(id)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-sm font-medium transition',
                      mode === id ? 'border-brand-500 bg-brand-500/5 text-ink-900' : 'border-ink-200 text-ink-600 hover:border-ink-300',
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2.5 text-sm font-medium text-ink-800">Accent colour</legend>
              <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Accent colour">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={accent === a.id}
                    onClick={() => setAccent(a.id)}
                    className="group flex flex-col items-center gap-1.5 text-xs text-ink-600"
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full text-white transition',
                        accent === a.id ? 'ring-2 ring-ink-900 ring-offset-2 ring-offset-surface' : 'group-hover:scale-110',
                      )}
                      style={{ backgroundColor: a.swatch }}
                    >
                      {accent === a.id && <Check className="h-4 w-4" strokeWidth={3} aria-hidden />}
                    </span>
                    {a.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </Card>

        <Card>
          <CardHeader title="Keyboard shortcuts" subtitle="Move faster without the mouse." />
          <ul className="divide-y divide-ink-100 px-5 pb-2 pt-2">
            {SHORTCUTS.map(([keys, label]) => (
              <li key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm text-ink-700">
                <span className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4 text-ink-400" aria-hidden />
                  {label}
                </span>
                <span className="flex gap-1">
                  {keys.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Session" subtitle="Signing out ends this session on the server immediately." />
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm text-ink-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              Your session lives in secure httpOnly cookies and renews automatically while you use the app.
            </p>
            <Button variant="secondary" onClick={() => void logout()}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
