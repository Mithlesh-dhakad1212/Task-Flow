'use client';

import { ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { ActionsMenu, type MenuItem } from '@/components/ui/menu';
import { STATUSES, STATUS_META } from '@/lib/constants';
import { type Task, type TaskStatus } from '@/lib/types';

export interface TaskActionHandlers {
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

/** Keyboard/touch-friendly alternative to drag-and-drop. */
export function TaskActions({ task, onEdit, onDelete, onStatusChange }: { task: Task } & TaskActionHandlers) {
  const items: MenuItem[] = [
    { label: 'Edit', icon: Pencil, onSelect: () => onEdit(task) },
    ...STATUSES.filter((s) => s !== task.status).map((s) => ({
      label: `Move to ${STATUS_META[s].label}`,
      icon: ArrowRight,
      onSelect: () => onStatusChange(task, s),
    })),
    { label: 'Delete', icon: Trash2, onSelect: () => onDelete(task), danger: true },
  ];
  return <ActionsMenu items={items} label={`Actions for ${task.title}`} />;
}
