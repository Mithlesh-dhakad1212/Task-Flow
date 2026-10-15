import { type ProjectColor, type TaskPriority, type TaskStatus } from './types';

export const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
export const PRIORITIES: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW'];

export const STATUS_META: Record<TaskStatus, { label: string; dot: string; badge: string; column: string }> = {
  TODO: {
    label: 'To Do',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    column: 'bg-amber-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    dot: 'bg-brand-600',
    badge: 'bg-brand-50 text-brand-700 ring-brand-600/20',
    column: 'bg-brand-600',
  },
  DONE: {
    label: 'Done',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    column: 'bg-emerald-500',
  },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; badge: string }> = {
  HIGH: { label: 'High', badge: 'bg-rose-50 text-rose-700 ring-rose-600/20' },
  MEDIUM: { label: 'Medium', badge: 'bg-amber-50 text-amber-800 ring-amber-600/20' },
  LOW: { label: 'Low', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
};

/** Full literal class names so Tailwind's content scanner keeps them. */
export const PROJECT_COLORS: Record<ProjectColor, { label: string; swatch: string; soft: string; bar: string; text: string }> = {
  blue: { label: 'Blue', swatch: 'bg-blue-600', soft: 'bg-blue-50 text-blue-600', bar: 'bg-blue-600', text: 'text-blue-600' },
  violet: { label: 'Violet', swatch: 'bg-violet-600', soft: 'bg-violet-50 text-violet-600', bar: 'bg-violet-600', text: 'text-violet-600' },
  emerald: { label: 'Green', swatch: 'bg-emerald-600', soft: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-600', text: 'text-emerald-600' },
  amber: { label: 'Amber', swatch: 'bg-amber-500', soft: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500', text: 'text-amber-600' },
  rose: { label: 'Rose', swatch: 'bg-rose-600', soft: 'bg-rose-50 text-rose-600', bar: 'bg-rose-600', text: 'text-rose-600' },
  cyan: { label: 'Cyan', swatch: 'bg-cyan-600', soft: 'bg-cyan-50 text-cyan-600', bar: 'bg-cyan-600', text: 'text-cyan-600' },
};

export const PROJECT_COLOR_KEYS = Object.keys(PROJECT_COLORS) as ProjectColor[];
