import { AlertTriangle, type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';
import { errorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { Button } from './button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-300 bg-white/60 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/60 px-6 py-12 text-center',
        className,
      )}
    >
      <AlertTriangle className="mb-3 h-8 w-8 text-rose-500" aria-hidden />
      <h3 className="text-sm font-semibold text-ink-900">Couldn&apos;t load this</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-600">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
