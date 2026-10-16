import { type ProjectColor, type TaskPriority, type TaskStatus } from './types';

// Full literal class names everywhere so Tailwind's content scanner keeps them.

export const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
export const PRIORITIES: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW'];

interface StatusMeta {
  label: string;
  /** Small dot / icon background */
  dot: string;
  /** Solid pill used for board column headers */
  pill: string;
  /** Soft badge / select styling */
  badge: string;
  /** Column accent (top border) and drop highlight */
  column: string;
  drop: string;
  text: string;
}

/**
 * Status hues were run through the dataviz palette validator (lightness band,
 * chroma floor, colour-blind separation, contrast) for both light and dark
 * surfaces: orange-600 / blue-600 (blue-500 on dark) / emerald-600 all pass.
 */
export const STATUS_META: Record<TaskStatus, StatusMeta> = {
  TODO: {
    label: 'To Do',
    dot: 'bg-orange-600',
    pill: 'bg-orange-600 text-white',
    badge: 'bg-orange-500/10 text-orange-700 ring-orange-500/25 dark:text-orange-300',
    column: 'border-t-orange-600',
    drop: 'bg-orange-500/10 ring-orange-400',
    text: 'text-orange-600 dark:text-orange-400',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    dot: 'bg-blue-600 dark:bg-blue-500',
    pill: 'bg-blue-600 text-white dark:bg-blue-500',
    badge: 'bg-blue-500/10 text-blue-700 ring-blue-500/25 dark:text-blue-300',
    column: 'border-t-blue-600 dark:border-t-blue-500',
    drop: 'bg-blue-500/10 ring-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
  },
  DONE: {
    label: 'Done',
    dot: 'bg-emerald-600',
    pill: 'bg-emerald-600 text-white',
    badge: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300',
    column: 'border-t-emerald-600',
    drop: 'bg-emerald-500/10 ring-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
};

/** SVG stroke/fill classes for the status donut (same validated hues). */
export const STATUS_CHART: Record<TaskStatus, string> = {
  TODO: 'stroke-orange-600',
  IN_PROGRESS: 'stroke-blue-600 dark:stroke-blue-500',
  DONE: 'stroke-emerald-600',
};

interface PriorityMeta {
  label: string;
  badge: string;
  /** Flag icon colour */
  flag: string;
  pill: string;
  column: string;
  drop: string;
  bar: string;
}

export const PRIORITY_META: Record<TaskPriority, PriorityMeta> = {
  HIGH: {
    label: 'High',
    badge: 'bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300',
    flag: 'text-rose-500 fill-rose-500',
    pill: 'bg-rose-500 text-white',
    column: 'border-t-rose-500',
    drop: 'bg-rose-500/10 ring-rose-400',
    bar: 'bg-rose-500',
  },
  MEDIUM: {
    label: 'Medium',
    badge: 'bg-yellow-500/10 text-yellow-800 ring-yellow-500/25 dark:text-yellow-300',
    flag: 'text-yellow-500 fill-yellow-500',
    pill: 'bg-yellow-500 text-slate-950',
    column: 'border-t-yellow-500',
    drop: 'bg-yellow-500/10 ring-yellow-400',
    bar: 'bg-yellow-500',
  },
  LOW: {
    label: 'Low',
    badge: 'bg-slate-500/10 text-slate-700 ring-slate-500/25 dark:text-slate-300',
    flag: 'text-slate-400 fill-slate-400',
    pill: 'bg-slate-500 text-white',
    column: 'border-t-slate-400',
    drop: 'bg-slate-500/10 ring-slate-400',
    bar: 'bg-slate-400',
  },
};

interface ProjectColorMeta {
  label: string;
  swatch: string;
  soft: string;
  bar: string;
  text: string;
  column: string;
  drop: string;
  gradient: string;
}

export const PROJECT_COLORS: Record<ProjectColor, ProjectColorMeta> = {
  blue: {
    label: 'Blue',
    swatch: 'bg-blue-600',
    soft: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    bar: 'bg-blue-600',
    text: 'text-blue-600 dark:text-blue-400',
    column: 'border-t-blue-500',
    drop: 'bg-blue-500/10 ring-blue-400',
    gradient: 'from-blue-600 to-indigo-700',
  },
  violet: {
    label: 'Violet',
    swatch: 'bg-violet-600',
    soft: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
    bar: 'bg-violet-600',
    text: 'text-violet-600 dark:text-violet-400',
    column: 'border-t-violet-500',
    drop: 'bg-violet-500/10 ring-violet-400',
    gradient: 'from-violet-600 to-fuchsia-700',
  },
  emerald: {
    label: 'Green',
    swatch: 'bg-emerald-600',
    soft: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    bar: 'bg-emerald-600',
    text: 'text-emerald-600 dark:text-emerald-400',
    column: 'border-t-emerald-500',
    drop: 'bg-emerald-500/10 ring-emerald-400',
    gradient: 'from-emerald-600 to-teal-700',
  },
  amber: {
    label: 'Amber',
    swatch: 'bg-amber-500',
    soft: 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    column: 'border-t-amber-500',
    drop: 'bg-amber-500/10 ring-amber-400',
    gradient: 'from-amber-600 to-orange-700',
  },
  rose: {
    label: 'Rose',
    swatch: 'bg-rose-600',
    soft: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    bar: 'bg-rose-600',
    text: 'text-rose-600 dark:text-rose-400',
    column: 'border-t-rose-500',
    drop: 'bg-rose-500/10 ring-rose-400',
    gradient: 'from-rose-600 to-pink-700',
  },
  cyan: {
    label: 'Cyan',
    swatch: 'bg-cyan-600',
    soft: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    bar: 'bg-cyan-600',
    text: 'text-cyan-600 dark:text-cyan-400',
    column: 'border-t-cyan-500',
    drop: 'bg-cyan-500/10 ring-cyan-400',
    gradient: 'from-cyan-600 to-sky-700',
  },
};

export const PROJECT_COLOR_KEYS = Object.keys(PROJECT_COLORS) as ProjectColor[];
