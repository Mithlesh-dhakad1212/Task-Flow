'use client';

import { useState } from 'react';
import { STATUS_CHART, STATUS_META } from '@/lib/constants';
import { type TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const ORDER: TaskStatus[] = ['DONE', 'IN_PROGRESS', 'TODO'];

/**
 * Dependency-free SVG donut of task counts per status. Hues come from the
 * validated status palette; identity is never colour-alone (legend with
 * labels, counts and percentages), and segments are separated by gaps.
 */
export function StatusDonut({ counts, completionRate }: { counts: Record<TaskStatus, number>; completionRate: number }) {
  const [hover, setHover] = useState<TaskStatus | null>(null);
  const total = ORDER.reduce((n, s) => n + counts[s], 0);
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const nonZero = ORDER.filter((s) => counts[s] > 0);
  const gap = nonZero.length > 1 ? 2 : 0;

  let offset = 0;
  const segments = nonZero.map((s) => {
    const length = (counts[s] / total) * circumference;
    const seg = { status: s, dash: Math.max(0, length - gap), offset };
    offset += length;
    return seg;
  });

  const center = hover
    ? { value: `${Math.round((counts[hover] / Math.max(total, 1)) * 100)}%`, label: STATUS_META[hover].label }
    : { value: `${completionRate}%`, label: 'complete' };

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around lg:flex-col 2xl:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={`${completionRate}% of tasks complete`}>
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="11" className="stroke-ink-100" />
          {segments.map((seg) => (
            <circle
              key={seg.status}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              strokeWidth={hover === seg.status ? 13 : 11}
              strokeLinecap="butt"
              onMouseEnter={() => setHover(seg.status)}
              onMouseLeave={() => setHover(null)}
              className={cn(STATUS_CHART[seg.status], 'transition-all duration-300', hover && hover !== seg.status && 'opacity-40')}
              strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
              strokeDashoffset={-seg.offset}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-ink-900">{center.value}</span>
          <span className="text-[11px] text-ink-500">{center.label}</span>
        </div>
      </div>

      <ul className="w-full max-w-56 space-y-2.5 text-sm">
        {ORDER.map((s) => (
          <li
            key={s}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(null)}
            className={cn('flex items-center justify-between gap-6 rounded-md px-1 transition', hover === s && 'bg-ink-100')}
          >
            <span className="flex items-center gap-2 text-ink-600">
              <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_META[s].dot)} aria-hidden />
              {s === 'DONE' ? 'Completed' : STATUS_META[s].label}
            </span>
            <span className="tabular-nums text-ink-500">
              <span className="font-semibold text-ink-900">{counts[s]}</span>
              <span className="ml-1.5 text-xs">{total ? Math.round((counts[s] / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
