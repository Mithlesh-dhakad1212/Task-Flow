'use client';

import { Flag } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, type ReactNode } from 'react';
import { Logo } from '@/components/layout/logo';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/auth-context';
import { cn, safeNext } from '@/lib/utils';

function CardSpinner() {
  return (
    <div className="flex h-72 items-center justify-center text-brand-600">
      <Spinner className="h-7 w-7" />
    </div>
  );
}

function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    if (status === 'authenticated') router.replace(safeNext(params.get('next')));
  }, [status, router, params]);

  if (status !== 'unauthenticated') return <CardSpinner />;
  return <>{children}</>;
}

/** Decorative mini board on the brand panel (purely visual, hidden from AT). */
function BoardPreview() {
  const columns = [
    { label: 'To Do', pill: 'bg-orange-500', cards: [['Plan sprint', 'text-yellow-400'], ['Write specs', 'text-rose-400']] },
    { label: 'In Progress', pill: 'bg-blue-500', cards: [['Build dashboard', 'text-rose-400']] },
    { label: 'Done', pill: 'bg-emerald-500', cards: [['Kick-off', 'text-slate-400'], ['Wireframes', 'text-yellow-400']] },
  ];
  return (
    <div className="grid grid-cols-3 gap-2" aria-hidden>
      {columns.map((c) => (
        <div key={c.label} className="rounded-lg bg-white/10 p-2 backdrop-blur">
          <span className={cn('inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white', c.pill)}>
            {c.label}
          </span>
          <div className="mt-2 space-y-1.5">
            {c.cards.map(([title, flag]) => (
              <div key={title} className="rounded-md bg-white/90 p-1.5 text-[10px] font-medium text-slate-800 shadow-sm">
                {title}
                <div className="mt-1 flex items-center gap-1">
                  <Flag className={cn('h-2.5 w-2.5 fill-current', flag)} />
                  <span className="h-1 w-8 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-brand-500/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/10 blur-3xl" aria-hidden />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-ink-200/70 bg-surface shadow-lift md:grid-cols-[1.1fr_1fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-brand-gradient p-10 text-white md:flex">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" aria-hidden />
          <Logo light />
          <div className="relative">
            <h2 className="text-balance text-4xl font-extrabold leading-tight tracking-tight">
              Plan it. Track it.
              <br />
              Ship it.
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/80">
              Projects, boards and progress in one calm workspace, with drag-and-drop Kanban and real-time stats.
            </p>
            <div className="mt-8">
              <BoardPreview />
            </div>
          </div>
          <p className="text-xs text-white/60">© TaskFlow</p>
        </section>

        <section className="p-8 sm:p-12">
          <Logo className="mb-8 md:hidden" />
          <Suspense fallback={<CardSpinner />}>
            <RedirectIfAuthenticated>{children}</RedirectIfAuthenticated>
          </Suspense>
        </section>
      </div>
    </div>
  );
}
