'use client';

import { AlignLeft } from 'lucide-react';
import { PROJECT_COLORS } from '@/lib/constants';
import { type Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { type TaskActionHandlers, TaskActions } from './task-actions';
import { DueChip, PriorityFlag, StatusCheck, StatusPill } from './task-bits';

/** ClickUp-style card: complete toggle, title, project tag, priority flag and due chip. */
export function TaskCard({
  task,
  showProject = true,
  showStatus = false,
  dragging,
  ...handlers
}: { task: Task; showProject?: boolean; showStatus?: boolean; dragging?: boolean } & TaskActionHandlers) {
  const color = PROJECT_COLORS[task.project.color] ?? PROJECT_COLORS.blue;
  const done = task.status === 'DONE';

  return (
    <article
      onClick={() => handlers.onEdit(task)}
      className={cn(
        'group relative cursor-pointer rounded-xl border border-ink-200/80 bg-surface p-3 shadow-card transition hover:border-brand-500/40 hover:shadow-md',
        dragging && 'rotate-2 scale-[1.02] opacity-60 shadow-lift',
        task.isOverdue && 'border-l-[3px] border-l-rose-500',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="pt-0.5">
          <StatusCheck
            status={task.status}
            label={task.title}
            onToggle={() => handlers.onStatusChange(task, done ? 'TODO' : 'DONE')}
          />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlers.onEdit(task);
          }}
          className={cn(
            'min-w-0 flex-1 text-left text-sm font-medium leading-snug text-ink-900 outline-none focus-visible:underline',
            done && 'text-ink-400 line-through decoration-ink-300',
          )}
        >
          {task.title}
        </button>
        <div
          className="-mr-1 -mt-1 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <TaskActions task={task} {...handlers} />
        </div>
      </div>

      {(showProject || showStatus) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-7">
          {showStatus && <StatusPill status={task.status} />}
          {showProject && (
            <span className={cn('inline-flex max-w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-[11px] font-medium', color.soft)}>
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', color.swatch)} aria-hidden />
              <span className="truncate">{task.project.name}</span>
            </span>
          )}
        </div>
      )}

      <div className="mt-2.5 flex items-center gap-2 pl-7">
        <PriorityFlag priority={task.priority} showLabel />
        <DueChip task={task} className="ml-auto" />
        {task.description && (
          <span title="Has description" className="text-ink-400">
            <AlignLeft className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">Has description</span>
          </span>
        )}
      </div>
    </article>
  );
}
