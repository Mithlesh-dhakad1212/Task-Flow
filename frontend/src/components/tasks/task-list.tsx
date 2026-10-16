'use client';

import { PROJECT_COLORS, STATUSES, STATUS_META } from '@/lib/constants';
import { type Task, type TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { TaskActions, type TaskActionHandlers } from './task-actions';
import { DueChip, PriorityFlag, StatusCheck } from './task-bits';

function StatusSelect({ task, onChange }: { task: Task; onChange: (status: TaskStatus) => void }) {
  const meta = STATUS_META[task.status];
  return (
    <select
      aria-label={`Status of ${task.title}`}
      value={task.status}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      className={cn(
        'h-7 cursor-pointer rounded-md border-0 py-0 pl-2 pr-7 text-[11px] font-bold uppercase tracking-wide focus:ring-2 focus:ring-brand-500',
        meta.pill,
      )}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="bg-surface font-medium normal-case text-ink-900">
          {STATUS_META[s].label}
        </option>
      ))}
    </select>
  );
}

/** Spreadsheet-like list: table on wide screens, stacked rows on phones. */
export function TaskList({ tasks, showProject, ...handlers }: { tasks: Task[]; showProject: boolean } & TaskActionHandlers) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-200/70 bg-surface shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="hidden border-b border-ink-200/70 bg-ink-50 text-[11px] font-semibold uppercase tracking-wider text-ink-500 md:table-header-group">
          <tr>
            <th scope="col" className="py-2.5 pl-4 pr-2">Name</th>
            {showProject && <th scope="col" className="px-3 py-2.5">Project</th>}
            <th scope="col" className="px-3 py-2.5">Status</th>
            <th scope="col" className="px-3 py-2.5">Priority</th>
            <th scope="col" className="px-3 py-2.5">Due date</th>
            <th scope="col" className="w-12 px-3 py-2.5"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {tasks.map((task) => {
            const color = PROJECT_COLORS[task.project.color] ?? PROJECT_COLORS.blue;
            return (
              <tr
                key={task.id}
                onClick={() => handlers.onEdit(task)}
                className={cn(
                  'flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 transition hover:bg-brand-500/[0.04] md:table-row md:p-0',
                  task.isOverdue && 'bg-rose-500/[0.03]',
                )}
              >
                <td className="w-full min-w-0 md:w-auto md:py-2.5 md:pl-4 md:pr-2">
                  <div className="flex items-center gap-3">
                    <StatusCheck
                      status={task.status}
                      label={task.title}
                      onToggle={() => handlers.onStatusChange(task, task.status === 'DONE' ? 'TODO' : 'DONE')}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlers.onEdit(task);
                      }}
                      className={cn(
                        'min-w-0 truncate text-left font-medium text-ink-900 hover:text-brand-600',
                        task.status === 'DONE' && 'text-ink-400 line-through decoration-ink-300',
                      )}
                    >
                      {task.title}
                    </button>
                  </div>
                </td>
                {showProject && (
                  <td className="md:px-3 md:py-2.5">
                    <span className={cn('inline-flex max-w-[12rem] items-center gap-1 truncate rounded px-1.5 py-0.5 text-[11px] font-medium', color.soft)}>
                      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', color.swatch)} aria-hidden />
                      <span className="truncate">{task.project.name}</span>
                    </span>
                  </td>
                )}
                <td className="md:px-3 md:py-2.5">
                  <StatusSelect task={task} onChange={(s) => handlers.onStatusChange(task, s)} />
                </td>
                <td className="md:px-3 md:py-2.5">
                  <PriorityFlag priority={task.priority} showLabel />
                </td>
                <td className="md:px-3 md:py-2.5">
                  <DueChip task={task} />
                </td>
                <td className="ml-auto md:ml-0 md:px-3 md:py-2.5" onClick={(e) => e.stopPropagation()}>
                  <TaskActions task={task} {...handlers} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
