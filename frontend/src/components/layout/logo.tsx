import { cn } from '@/lib/utils';

/** Brand mark: three stacked "flow" bars in the accent gradient. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient shadow-glow', className)} aria-hidden>
      <svg viewBox="0 0 20 20" className="h-4 w-4 text-white" fill="currentColor">
        <rect x="2" y="3" width="11" height="3.2" rx="1.6" />
        <rect x="5" y="8.4" width="13" height="3.2" rx="1.6" opacity="0.85" />
        <rect x="2" y="13.8" width="8" height="3.2" rx="1.6" opacity="0.7" />
      </svg>
    </span>
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className={cn('text-lg font-bold tracking-tight', light ? 'text-white' : 'text-ink-900')}>TaskFlow</span>
    </div>
  );
}
