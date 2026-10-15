'use client';

import { PriorityBadge } from '@/components/ui/badge';
import { PROJECT_COLORS, STATUSES, STATUS_META } from '@/lib/constants';
import { formatDue, formatShortDate } from '@/lib/dates';
import { type Task, type TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { TaskActions, type TaskActionHandlers } from './task-actions';

function StatusSelect({ task, onChange }: { task: Task; onChange: (status: TaskStatus) => void }) {
  const meta = STATUS_META[task.status];
  return (
    <select
      aria-label={`Status of ${task.title}`}
      value={task.status}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      className={cn(
        'h-7 cursor-pointer rounded-md border-0 py-0 pl-2 pr-7 text-xs font-semibold ring-1 ring-inset focus:ring-2 focus:ring-brand-500',
        meta.badge,
      )}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_META[s].label}
        </option>
      ))}
    </select>
  );
}

/** Table on wide screens, stacked rows on phones. */
export function TaskList({ tasks, showProject, ...handlers }: { tasks: Task[]; showProject: boolean } & TaskActionHandlers) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-200/70 bg-white shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="hidden border-b border-ink-100 bg-ink-50/70 text-xs font-semibold uppercase tracking-wide text-ink-500 md:table-header-group">
          <tr>
            <th scope="col" className="px-4 py-3">Task</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Priority</th>
            <th scope="col" className="px-4 py-3">Due</th>
            <th scope="col" className="w-12 px-4 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {tasks.map((task) => (
            <tr key={task.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 hover:bg-ink-50/50 md:table-row md:p-0">
              <td className="w-full min-w-0 md:w-auto md:px-4 md:py-3">
                <button
                  type="button"
                  onClick={() => handlers.onEdit(task)}
                  className={cn(
                    'text-left font-medium text-ink-900 hover:text-brand-700',
                    task.status === 'DONE' && 'text-ink-500 line-through decoration-ink-300',
                  )}
                >
                  {task.title}
                </button>
                {showProject && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
                    <span className={cn('h-2 w-2 rounded-sm', PROJECT_COLORS[task.project.color]?.swatch)} aria-hidden />
                    {task.project.name}
                  </p>
                )}
              </td>
              <td className="md:px-4 md:py-3">
                <StatusSelect task={task} onChange={(s) => handlers.onStatusChange(task, s)} />
              </td>
              <td className="md:px-4 md:py-3">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className={cn('text-xs md:px-4 md:py-3', task.isOverdue ? 'font-semibold text-rose-600' : 'text-ink-500')}>
                <span title={task.dueDate}>
                  {task.status === 'DONE' ? formatShortDate(task.dueDate) : formatDue(task.dueDate)}
                </span>
              </td>
              <td className="ml-auto md:ml-0 md:px-4 md:py-3">
                <TaskActions task={task} {...handlers} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
