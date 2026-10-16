import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const TONES = {
  brand: { icon: 'bg-brand-500/10 text-brand-600 dark:text-brand-400', value: 'text-ink-900' },
  blue: { icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', value: 'text-ink-900' },
  emerald: { icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', value: 'text-ink-900' },
  rose: { icon: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', value: 'text-rose-600 dark:text-rose-400' },
} as const;

/** Headline number tile (a stat tile, not a chart: one value, one label). */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  href,
}: {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  tone: keyof typeof TONES;
  href: string;
}) {
  const t = TONES[tone];
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-ink-200/70 bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift sm:p-5"
    >
      <div className="flex items-center gap-3">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', t.icon)}>
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <p className="text-sm font-medium text-ink-600">{label}</p>
        <ArrowUpRight className="ml-auto h-4 w-4 text-ink-300 transition group-hover:text-ink-600" aria-hidden />
      </div>
      <p className={cn('mt-4 text-3xl font-bold tracking-tight tabular-nums', t.value)}>{value}</p>
      <p className="mt-1 text-xs text-ink-500">{hint}</p>
    </Link>
  );
}
