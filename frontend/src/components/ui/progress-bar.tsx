import { cn } from '@/lib/utils';

export function ProgressBar({
  value,
  className,
  barClassName = 'bg-brand-600',
  label,
}: {
  value: number;
  className?: string;
  barClassName?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-ink-100', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500', barClassName)} style={{ width: `${pct}%` }} />
    </div>
  );
}
