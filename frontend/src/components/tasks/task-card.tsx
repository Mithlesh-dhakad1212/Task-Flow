'use client';

import { CalendarDays } from 'lucide-react';
import { PriorityBadge } from '@/components/ui/badge';
import { PROJECT_COLORS } from '@/lib/constants';
import { formatDue, formatShortDate } from '@/lib/dates';
import { type Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { TaskActions, type TaskActionHandlers } from './task-actions';

export function TaskCard({
  task,
  showProject = true,
  dragging,
  ...handlers
}: { task: Task; showProject?: boolean; dragging?: boolean } & TaskActionHandlers) {
  const color = PROJECT_COLORS[task.project.color] ?? PROJECT_COLORS.blue;
  const done = task.status === 'DONE';

  return (
    <article
      className={cn(
        'group rounded-lg border border-ink-200/80 bg-white p-3.5 shadow-card transition hover:border-ink-300 hover:shadow-md',
        dragging && 'rotate-1 opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => handlers.onEdit(task)}
          className={cn(
            'text-left text-sm font-semibold leading-snug text-ink-900 hover:text-brand-700',
            done && 'text-ink-500 line-through decoration-ink-300',
          )}
        >
          {task.title}
        </button>
        <div className="-mr-1.5 -mt-1 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <TaskActions task={task} {...handlers} />
        </div>
      </div>

      {showProject && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
          <span className={cn('h-2 w-2 rounded-sm', color.swatch)} aria-hidden />
          <span className="truncate">{task.project.name}</span>
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs',
            task.isOverdue ? 'font-semibold text-rose-600' : 'text-ink-500',
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          {done ? formatShortDate(task.dueDate) : formatDue(task.dueDate)}
        </span>
      </div>
    </article>
  );
}
