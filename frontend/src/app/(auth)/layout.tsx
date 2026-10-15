'use client';

import { CheckCircle2, FolderKanban, LineChart } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, type ReactNode } from 'react';
import { Logo } from '@/components/layout/logo';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/auth-context';
import { safeNext } from '@/lib/utils';

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

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink-50 px-4 py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-100" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand-100/70" aria-hidden />

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-lift md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-ink-900 p-10 text-white md:flex">
          <Logo />
          <div>
            <h2 className="text-3xl font-bold leading-tight">
              Get things done,
              <br />
              together.
            </h2>
            <p className="mt-3 text-sm text-ink-300">A simple workspace to manage projects, tasks, and progress.</p>
            <ul className="mt-8 flex flex-wrap gap-2 text-xs font-medium">
              <li className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                <FolderKanban className="h-3.5 w-3.5 text-brand-300" aria-hidden /> Projects
              </li>
              <li className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-violet-300" aria-hidden /> Tasks
              </li>
              <li className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                <LineChart className="h-3.5 w-3.5 text-emerald-300" aria-hidden /> Progress
              </li>
            </ul>
          </div>
          <p className="text-xs text-ink-500">© TaskFlow</p>
        </section>

        <section className="p-8 sm:p-10">
          <Logo dark={false} className="mb-8 md:hidden" />
          <Suspense fallback={<CardSpinner />}>
            <RedirectIfAuthenticated>{children}</RedirectIfAuthenticated>
          </Suspense>
        </section>
      </div>
    </div>
  );
}
