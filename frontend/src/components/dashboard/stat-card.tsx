import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
  tone: 'brand' | 'violet' | 'emerald' | 'rose';
  href?: string;
}) {
  const tones = {
    brand: 'text-brand-600 bg-brand-50',
    violet: 'text-violet-600 bg-violet-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    rose: 'text-rose-600 bg-rose-50',
  }[tone];

  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink-600">{label}</p>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tones)}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className={cn('mt-2 text-3xl font-bold tracking-tight', tones.split(' ')[0])}>{value}</p>
      <p className="mt-1 text-[11px] text-ink-400">{hint}</p>
    </>
  );

  const className = 'block rounded-xl border border-ink-200/70 bg-white p-4 shadow-card transition sm:p-5';
  return href ? (
    <Link href={href} className={cn(className, 'hover:-translate-y-0.5 hover:shadow-lift')}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
