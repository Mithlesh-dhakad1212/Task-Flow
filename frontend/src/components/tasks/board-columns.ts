import { PRIORITIES, PRIORITY_META, PROJECT_COLORS, STATUSES, STATUS_META } from '@/lib/constants';
import { type Task, type TaskInput, type TaskStatus } from '@/lib/types';

export type GroupBy = 'status' | 'priority' | 'project';

export interface BoardColumn {
  key: string;
  label: string;
  /** Solid header pill */
  pill: string;
  /** Top border accent */
  accent: string;
  /** Drop-target highlight */
  drop: string;
  /** Field change applied when a card is dropped here / quick-added here */
  patch: Partial<TaskInput>;
  matches: (task: Task) => boolean;
}

/**
 * Builds board columns for a grouping. Dropping a card on a column applies
 * that column's `patch` — so the same drag gesture changes status, priority
 * or project depending on how the board is grouped.
 */
export function buildColumns(
  groupBy: GroupBy,
  opts: { statuses?: TaskStatus[]; projects?: { id: string; name: string; color: keyof typeof PROJECT_COLORS }[] } = {},
): BoardColumn[] {
  if (groupBy === 'priority') {
    return PRIORITIES.map((p) => ({
      key: p,
      label: `${PRIORITY_META[p].label} priority`,
      pill: PRIORITY_META[p].pill,
      accent: PRIORITY_META[p].column,
      drop: PRIORITY_META[p].drop,
      patch: { priority: p },
      matches: (t) => t.priority === p,
    }));
  }
  if (groupBy === 'project') {
    return (opts.projects ?? []).map((p) => {
      const c = PROJECT_COLORS[p.color] ?? PROJECT_COLORS.blue;
      return {
        key: p.id,
        label: p.name,
        pill: `${c.swatch} text-white`,
        accent: c.column,
        drop: c.drop,
        patch: { projectId: p.id },
        matches: (t: Task) => t.projectId === p.id,
      };
    });
  }
  const visible = opts.statuses?.length ? STATUSES.filter((s) => opts.statuses!.includes(s)) : STATUSES;
  return visible.map((s) => ({
    key: s,
    label: STATUS_META[s].label,
    pill: STATUS_META[s].pill,
    accent: STATUS_META[s].column,
    drop: STATUS_META[s].drop,
    patch: { status: s },
    matches: (t) => t.status === s,
  }));
}

/** True when dropping `task` on `column` would actually change something. */
export function wouldChange(task: Task, column: BoardColumn): boolean {
  return !column.matches(task);
}
