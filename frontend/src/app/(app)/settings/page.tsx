'use client';

import { LogOut, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { initials } from '@/lib/utils';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <>
      <PageHeader title="Settings" description="Your account and session." />
      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardHeader title="Profile" />
          <div className="flex items-center gap-4 p-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
              {initials(user.name)}
            </span>
            <dl className="grid gap-1 text-sm">
              <div>
                <dt className="sr-only">Name</dt>
                <dd className="font-semibold text-ink-900">{user.name}</dd>
              </div>
              <div>
                <dt className="sr-only">Email</dt>
                <dd className="text-ink-600">{user.email}</dd>
              </div>
              <div>
                <dt className="sr-only">Member since</dt>
                <dd className="text-xs text-ink-400">
                  Member since{' '}
                  {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card>
          <CardHeader title="Session" subtitle="Signing out ends this session on the server immediately." />
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm text-ink-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              Your session is stored in secure, httpOnly cookies and renews automatically while you use the app.
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
