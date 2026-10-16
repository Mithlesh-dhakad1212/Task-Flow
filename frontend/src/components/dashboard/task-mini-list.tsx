'use client';

import { DueChip, PriorityFlag, StatusCheck } from '@/components/tasks/task-bits';
import { useUI } from '@/context/ui-context';
import { useUpdateTask } from '@/hooks/use-tasks';
import { PROJECT_COLORS } from '@/lib/constants';
import { type Task } from '@/lib/types';
import { cn } from '@/lib/utils';

export function TaskMiniList({ tasks, empty }: { tasks: Task[]; empty: string }) {
  const { openTask } = useUI();
  const update = useUpdateTask();

  if (tasks.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-ink-400">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-ink-100">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center gap-3 px-5 py-3 transition hover:bg-ink-50">
          <StatusCheck
            status={t.status}
            label={t.title}
            onToggle={() => update.mutate({ id: t.id, input: { status: t.status === 'DONE' ? 'TODO' : 'DONE' } })}
          />
          <button type="button" onClick={() => openTask(t.id)} className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-ink-900">{t.title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-500">
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', PROJECT_COLORS[t.project.color]?.swatch)} aria-hidden />
              {t.project.name}
            </p>
          </button>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <PriorityFlag priority={t.priority} />
            <DueChip task={t} />
          </div>
        </li>
      ))}
    </ul>
  );
}
