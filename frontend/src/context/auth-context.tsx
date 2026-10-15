'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, setSessionExpiredHandler } from '@/lib/api/client';
import { authApi } from '@/lib/api/endpoints';
import { type User } from '@/lib/types';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: User | null;
  status: Status;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Session state lives in httpOnly cookies that JavaScript cannot read, so the
 * client learns who it is by asking the API (`/auth/me`). The API client
 * transparently refreshes an expired access token; if that fails we fall back
 * to the logged-out state.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      })
      .catch((err) => {
        if (cancelled) return;
        if (!(err instanceof ApiError) || err.status !== 401) console.error('Session check failed', err);
        setStatus('unauthenticated');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setStatus('unauthenticated');
      queryClient.clear();
    });
    return () => setSessionExpiredHandler(null);
  }, [queryClient]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      queryClient.clear();
      setUser(res.user);
      setStatus('authenticated');
    },
    [queryClient],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await authApi.register({ name, email, password });
      queryClient.clear();
      setUser(res.user);
      setStatus('authenticated');
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      // Clear cached data so the next user on this browser never sees it.
      queryClient.clear();
      setUser(null);
      setStatus('unauthenticated');
      router.replace('/login');
    }
  }, [queryClient, router]);

  const value = useMemo(() => ({ user, status, login, register, logout }), [user, status, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
