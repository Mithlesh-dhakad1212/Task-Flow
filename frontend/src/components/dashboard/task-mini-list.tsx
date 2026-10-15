import Link from 'next/link';
import { PriorityBadge } from '@/components/ui/badge';
import { PROJECT_COLORS } from '@/lib/constants';
import { formatDue } from '@/lib/dates';
import { type Task } from '@/lib/types';
import { cn } from '@/lib/utils';

export function TaskMiniList({ tasks, empty }: { tasks: Task[]; empty: string }) {
  if (tasks.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-ink-400">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-ink-100">
      {tasks.map((t) => (
        <li key={t.id}>
          <Link
            href={`/projects/${t.projectId}`}
            className="flex items-center gap-3 px-5 py-3 transition hover:bg-ink-50"
          >
            <span className={cn('h-2 w-2 shrink-0 rounded-full', PROJECT_COLORS[t.project.color]?.swatch)} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-900">{t.title}</p>
              <p className="truncate text-xs text-ink-500">{t.project.name}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <PriorityBadge priority={t.priority} />
              <span className={cn('text-[11px]', t.isOverdue ? 'font-semibold text-rose-600' : 'text-ink-500')}>
                {formatDue(t.dueDate)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
