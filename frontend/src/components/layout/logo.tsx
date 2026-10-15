import { cn } from '@/lib/utils';

export function Logo({ className, dark = true }: { className?: string; dark?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-sm">
        T
      </span>
      <span className={cn('text-lg font-bold tracking-tight', dark ? 'text-white' : 'text-ink-900')}>TaskFlow</span>
    </div>
  );
}
