import Link from 'next/link';
import { PriorityFlag } from '@/components/tasks/task-bits';
import { PRIORITIES } from '@/lib/constants';
import { type TaskPriority } from '@/lib/types';

/**
 * Open tasks by priority: one measure across three categories, so a single
 * hue; the category is named by the label and flag, never by colour.
 */
export function PriorityBars({ counts }: { counts: Record<TaskPriority, number> }) {
  const max = Math.max(1, ...PRIORITIES.map((p) => counts[p]));
  return (
    <ul className="space-y-3.5">
      {PRIORITIES.map((p) => (
        <li key={p}>
          <Link href={`/tasks?priority=${p}&status=TODO,IN_PROGRESS&view=list`} className="group block" title={`${counts[p]} open ${p.toLowerCase()} priority tasks`}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <PriorityFlag priority={p} showLabel className="text-sm group-hover:text-ink-900" />
              <span className="font-semibold tabular-nums text-ink-900">{counts[p]}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-brand-600 transition-[width] duration-700 group-hover:bg-brand-500 dark:bg-brand-500"
                style={{ width: `${(counts[p] / max) * 100}%` }}
              />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
