'use client';

import { useEffect } from 'react';

/** Last-resort boundary for unexpected rendering errors. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-ink-900">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-ink-500">An unexpected error occurred. You can try again.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Try again
      </button>
    </div>
  );
}
