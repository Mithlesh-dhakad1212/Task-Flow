import { STATUS_META } from '@/lib/constants';
import { type TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const STROKES: Record<TaskStatus, string> = {
  DONE: 'stroke-emerald-500',
  IN_PROGRESS: 'stroke-brand-600',
  TODO: 'stroke-amber-500',
};

/** Dependency-free SVG donut of task counts per status. */
export function StatusDonut({ counts, completionRate }: { counts: Record<TaskStatus, number>; completionRate: number }) {
  const order: TaskStatus[] = ['DONE', 'IN_PROGRESS', 'TODO'];
  const total = order.reduce((n, s) => n + counts[s], 0);
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const gap = total > 1 ? 1.5 : 0;

  let offset = 0;
  const segments = order
    .filter((s) => counts[s] > 0)
    .map((s) => {
      const length = (counts[s] / total) * circumference;
      const seg = { status: s, dash: Math.max(0, length - gap), offset };
      offset += length;
      return seg;
    });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around lg:flex-col xl:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={`${completionRate}% of tasks complete`}>
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="12" className="stroke-ink-100" />
          {segments.map((seg) => (
            <circle
              key={seg.status}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              strokeWidth="12"
              className={cn(STROKES[seg.status], 'transition-all duration-700')}
              strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
              strokeDashoffset={-seg.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink-900">{completionRate}%</span>
          <span className="text-[11px] text-ink-500">complete</span>
        </div>
      </div>

      <ul className="w-full max-w-56 space-y-2.5 text-sm">
        {order.map((s) => (
          <li key={s} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-ink-600">
              <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_META[s].dot)} aria-hidden />
              {s === 'DONE' ? 'Completed' : STATUS_META[s].label}
            </span>
            <span className="font-semibold tabular-nums text-ink-900">{counts[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
