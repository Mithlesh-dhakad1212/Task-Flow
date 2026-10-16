'use client';

import { CalendarDays, Check, Flag } from 'lucide-react';
import { PRIORITY_META, STATUS_META } from '@/lib/constants';
import { daysFromToday, formatDue, formatShortDate } from '@/lib/dates';
import { type Task, type TaskPriority, type TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export function PriorityFlag({ priority, showLabel, className }: { priority: TaskPriority; showLabel?: boolean; className?: string }) {
  const meta = PRIORITY_META[priority];
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium text-ink-600', className)} title={`${meta.label} priority`}>
      <Flag className={cn('h-3.5 w-3.5', meta.flag)} aria-hidden />
      {showLabel ? meta.label : <span className="sr-only">{meta.label} priority</span>}
    </span>
  );
}

/** Due date chip: red when overdue, amber for today, neutral otherwise. */
export function DueChip({ task, className }: { task: Pick<Task, 'dueDate' | 'status'>; className?: string }) {
  const done = task.status === 'DONE';
  const diff = daysFromToday(task.dueDate);
  const tone = done
    ? 'text-ink-400'
    : diff < 0
      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold'
      : diff === 0
        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold'
        : 'text-ink-500';
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs', tone, className)}
      title={`Due ${formatShortDate(task.dueDate)}`}
    >
      <CalendarDays className="h-3.5 w-3.5" aria-hidden />
      {done ? formatShortDate(task.dueDate) : formatDue(task.dueDate)}
    </span>
  );
}

/** Round "complete" toggle, ClickUp style. */
export function StatusCheck({
  status,
  onToggle,
  label,
  size = 'md',
}: {
  status: TaskStatus;
  onToggle: () => void;
  label: string;
  size?: 'sm' | 'md';
}) {
  const done = status === 'DONE';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Mark “${label}” as not done` : `Mark “${label}” as done`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        'group/check flex shrink-0 items-center justify-center rounded-full border-2 transition',
        size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]',
        done
          ? 'animate-pop border-emerald-600 bg-emerald-600 text-white'
          : status === 'IN_PROGRESS'
            ? 'border-blue-500 hover:bg-blue-500/10'
            : 'border-ink-300 hover:border-emerald-500 hover:bg-emerald-500/10',
      )}
    >
      <Check
        className={cn('h-2.5 w-2.5', done ? 'opacity-100' : 'text-emerald-600 opacity-0 group-hover/check:opacity-100')}
        strokeWidth={4}
        aria-hidden
      />
    </button>
  );
}

export function StatusPill({ status, className }: { status: TaskStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', meta.pill, className)}>
      {meta.label}
    </span>
  );
}

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-ink-200 bg-ink-50 px-1 font-sans text-[10px] font-semibold text-ink-500',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
