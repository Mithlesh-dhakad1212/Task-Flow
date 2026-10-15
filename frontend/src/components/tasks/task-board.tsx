'use client';

import { Plus } from 'lucide-react';
import { useState, type DragEvent } from 'react';
import { STATUSES, STATUS_META } from '@/lib/constants';
import { type Task, type TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { type TaskActionHandlers } from './task-actions';
import { TaskCard } from './task-card';

const DRAG_TYPE = 'application/x-taskflow-task';

/**
 * Kanban board. Cards can be dragged between columns (HTML5 drag-and-drop);
 * the card menu offers the same "Move to…" actions for keyboard and touch users.
 */
export function TaskBoard({
  tasks,
  visibleStatuses,
  showProject,
  onCreate,
  ...handlers
}: {
  tasks: Task[];
  visibleStatuses: TaskStatus[];
  showProject: boolean;
  onCreate: (status: TaskStatus) => void;
} & TaskActionHandlers) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);
  const columns = visibleStatuses.length ? STATUSES.filter((s) => visibleStatuses.includes(s)) : STATUSES;

  const onDrop = (e: DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setOverColumn(null);
    const id = e.dataTransfer.getData(DRAG_TYPE);
    const task = tasks.find((t) => t.id === id);
    if (task && task.status !== status) handlers.onStatusChange(task, status);
  };

  return (
    <div
      className={cn(
        'grid gap-4',
        columns.length === 3 ? 'md:grid-cols-3' : columns.length === 2 ? 'md:grid-cols-2' : 'md:max-w-md',
      )}
    >
      {columns.map((status) => {
        const items = tasks.filter((t) => t.status === status);
        const meta = STATUS_META[status];
        return (
          <section
            key={status}
            aria-label={`${meta.label} column`}
            onDragOver={(e) => {
              if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (overColumn !== status) setOverColumn(status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverColumn(null);
            }}
            onDrop={(e) => onDrop(e, status)}
            className={cn(
              'flex min-h-48 flex-col rounded-xl border bg-ink-100/60 p-3 transition-colors',
              overColumn === status ? 'border-brand-400 bg-brand-50/70' : 'border-ink-200/60',
            )}
          >
            <header className="mb-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-card">
              <div className="flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', meta.dot)} aria-hidden />
                <h3 className="text-xs font-bold uppercase tracking-wide text-ink-800">{meta.label}</h3>
              </div>
              <div className="flex items-center gap-1">
                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-600">
                  {items.length}
                </span>
                <button
                  type="button"
                  onClick={() => onCreate(status)}
                  className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                  aria-label={`Add task to ${meta.label}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </header>

            <ul className="scrollbar-thin -mx-1 flex flex-1 flex-col gap-2.5 px-1 pb-1 md:max-h-[calc(100dvh-20rem)] md:min-h-32 md:overflow-y-auto">
              {items.map((task) => (
                <li
                  key={task.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_TYPE, task.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggingId(task.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setOverColumn(null);
                  }}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <TaskCard task={task} showProject={showProject} dragging={draggingId === task.id} {...handlers} />
                </li>
              ))}
              {items.length === 0 && (
                <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-ink-300 px-3 py-8 text-center text-xs text-ink-400">
                  {draggingId ? 'Drop here' : 'No tasks'}
                </li>
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
