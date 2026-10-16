'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { FullPageSpinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/auth-context';
import { UIProvider } from '@/context/ui-context';

/**
 * Client-side route guard for UX only — the API enforces authentication and
 * ownership on every request regardless of what the UI does.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status !== 'authenticated') return <FullPageSpinner />;
  return (
    <UIProvider>
      <AppShell>{children}</AppShell>
    </UIProvider>
  );
}
