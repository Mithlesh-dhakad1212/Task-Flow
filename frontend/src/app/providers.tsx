'use client';

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster, toast } from 'sonner';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider, useTheme } from '@/context/theme-context';
import { ApiError, errorMessage } from '@/lib/api/client';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        // Retry network/5xx blips, but never 4xx (they won't fix themselves).
        retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
      },
    },
    mutationCache: new MutationCache({
      // One place that surfaces mutation failures. Forms that show inline
      // field errors opt out with `meta: { silent: true }`.
      onError: (err, _vars, _ctx, mutation) => {
        if (mutation.meta?.silent) return;
        if (err instanceof ApiError && err.status === 401) return;
        toast.error(errorMessage(err));
      },
    }),
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
        <ThemedToaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function ThemedToaster() {
  const { isDark } = useTheme();
  return <Toaster position="bottom-right" richColors closeButton theme={isDark ? 'dark' : 'light'} />;
}
