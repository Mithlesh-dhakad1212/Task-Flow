'use client';

import { ChevronsLeftRight, ChevronsRightLeft, Plus } from 'lucide-react';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { type Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { type BoardColumn, wouldChange } from './board-columns';
import { type TaskActionHandlers } from './task-actions';
import { TaskCard } from './task-card';

const DRAG_TYPE = 'application/x-taskflow-task';

interface TaskBoardProps extends TaskActionHandlers {
  tasks: Task[];
  columns: BoardColumn[];
  showProject: boolean;
  showStatus?: boolean;
  /** Apply a column's patch to a task (drag-and-drop). */
  onMove: (task: Task, column: BoardColumn) => void;
  /** Inline quick add: create a task with this title in this column. */
  onQuickAdd: (column: BoardColumn, title: string) => Promise<unknown>;
}

/**
 * Kanban board. Cards can be dragged between columns (HTML5 drag-and-drop);
 * the card menu offers status moves for keyboard and touch users. Columns
 * collapse, and each has an inline "Add task" row like ClickUp.
 */
export function TaskBoard({ tasks, columns, showProject, showStatus, onMove, onQuickAdd, ...handlers }: TaskBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapsed = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const dropHandlers = (column: BoardColumn) => ({
    onDragOver: (e: DragEvent<HTMLElement>) => {
      if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (overColumn !== column.key) setOverColumn(column.key);
    },
    onDragLeave: (e: DragEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverColumn(null);
    },
    onDrop: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      setOverColumn(null);
      const task = tasks.find((t) => t.id === e.dataTransfer.getData(DRAG_TYPE));
      if (task && wouldChange(task, column)) onMove(task, column);
    },
  });

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 scrollbar-thin sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex min-w-max gap-3 lg:min-w-0">
        {columns.map((column) => {
          const items = tasks.filter(column.matches);
          const isOver = overColumn === column.key;

          if (collapsed.has(column.key)) {
            return (
              <section
                key={column.key}
                aria-label={`${column.label} column (collapsed)`}
                {...dropHandlers(column)}
                className={cn(
                  'flex w-11 shrink-0 flex-col items-center gap-3 rounded-xl border border-t-4 border-ink-200/70 bg-ink-100/50 py-3 transition',
                  column.accent,
                  isOver && cn('ring-2', column.drop),
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleCollapsed(column.key)}
                  className="rounded p-1 text-ink-400 hover:bg-ink-200 hover:text-ink-800"
                  aria-label={`Expand ${column.label}`}
                >
                  <ChevronsLeftRight className="h-4 w-4" />
                </button>
                <span className="rounded-full bg-ink-200/70 px-1.5 text-[11px] font-semibold text-ink-600">{items.length}</span>
                <span className="text-xs font-bold uppercase tracking-wide text-ink-600 [writing-mode:vertical-rl]">
                  {column.label}
                </span>
              </section>
            );
          }

          return (
            <section
              key={column.key}
              aria-label={`${column.label} column`}
              {...dropHandlers(column)}
              className={cn(
                'flex w-[19rem] shrink-0 flex-col rounded-xl border border-t-4 border-ink-200/70 bg-ink-100/50 transition-colors lg:w-auto lg:min-w-[17rem] lg:flex-1',
                column.accent,
                isOver && cn('ring-2', column.drop),
              )}
            >
              <header className="flex items-center gap-2 px-3 pb-2 pt-3">
                <span className={cn('truncate rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide', column.pill)}>
                  {column.label}
                </span>
                <span className="text-xs font-semibold tabular-nums text-ink-500">{items.length}</span>
                <button
                  type="button"
                  onClick={() => toggleCollapsed(column.key)}
                  className="ml-auto rounded-md p-1 text-ink-400 hover:bg-ink-200/70 hover:text-ink-800"
                  aria-label={`Collapse ${column.label}`}
                  title="Collapse"
                >
                  <ChevronsRightLeft className="h-4 w-4" />
                </button>
              </header>

              <ul className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-1 scrollbar-thin md:max-h-[calc(100dvh-19rem)] md:min-h-24">
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
                  >
                    <TaskCard
                      task={task}
                      showProject={showProject}
                      showStatus={showStatus}
                      dragging={draggingId === task.id}
                      {...handlers}
                    />
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="flex min-h-20 flex-1 items-center justify-center rounded-lg border border-dashed border-ink-300/80 px-3 py-6 text-center text-xs text-ink-400">
                    {draggingId ? 'Drop here' : 'Nothing here yet'}
                  </li>
                )}
              </ul>

              <QuickAdd column={column} onAdd={onQuickAdd} />
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** "+ Add task" row that turns into an input; Enter creates and stays open for the next one. */
function QuickAdd({ column, onAdd }: { column: BoardColumn; onAdd: TaskBoardProps['onQuickAdd'] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !saving) inputRef.current?.focus();
  }, [open, saving]);

  const submit = async () => {
    const value = title.trim();
    if (!value || saving) return;
    setSaving(true);
    try {
      await onAdd(column, value);
      setTitle('');
    } catch {
      // Error toast is shown globally; keep the text so it can be retried.
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="m-2 mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-ink-500 transition hover:bg-ink-200/60 hover:text-ink-800"
      >
        <Plus className="h-4 w-4" aria-hidden /> Add task
      </button>
    );
  }

  return (
    <form
      className="m-2 mt-1"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            setOpen(false);
            setTitle('');
          }
        }}
        onBlur={() => !title.trim() && !saving && setOpen(false)}
        maxLength={200}
        readOnly={saving}
        placeholder="Task name, then press Enter"
        aria-label={`New task in ${column.label}`}
        className="h-9 w-full rounded-lg border-0 bg-surface px-3 text-sm text-ink-900 shadow-card ring-1 ring-inset ring-brand-500/60 placeholder:text-ink-400 focus:ring-2 focus:ring-brand-500"
      />
      <p className="mt-1 px-1 text-[11px] text-ink-400">Enter to save · Esc to cancel</p>
    </form>
  );
}
