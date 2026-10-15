import { type ReactNode } from 'react';
import { PRIORITY_META, STATUS_META } from '@/lib/constants';
import { type TaskPriority, type TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge className={meta.badge}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden />
      {meta.label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const meta = PRIORITY_META[priority];
  return (
    <Badge className={meta.badge}>
      <span className="sr-only">Priority: </span>
      {meta.label}
    </Badge>
  );
}
