'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { PRIORITIES, STATUSES } from '@/lib/constants';
import { type TaskListParams, type TaskPriority, type TaskStatus } from '@/lib/types';

export const SORT_OPTIONS = {
  due: { label: 'Due date', sortBy: 'dueDate', order: 'asc' },
  priority: { label: 'Priority', sortBy: 'priority', order: 'desc' },
  newest: { label: 'Newest', sortBy: 'createdAt', order: 'desc' },
  updated: { label: 'Recently updated', sortBy: 'updatedAt', order: 'desc' },
  title: { label: 'Title (A–Z)', sortBy: 'title', order: 'asc' },
} as const satisfies Record<string, { label: string; sortBy: TaskListParams['sortBy']; order: 'asc' | 'desc' }>;
export type SortKey = keyof typeof SORT_OPTIONS;

export type TaskView = 'board' | 'list';

export interface TaskFilters {
  search: string;
  status: TaskStatus[];
  priority: TaskPriority[];
  projectId?: string;
  overdue: boolean;
  view: TaskView;
  sort: SortKey;
  page: number;
}

function parseList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return [];
  return raw.split(',').filter((v): v is T => (allowed as readonly string[]).includes(v));
}

/**
 * Filters live in the URL (?q=&status=&priority=&project=&overdue=&view=&sort=&page=)
 * so a filtered view can be bookmarked, shared and survives a reload.
 */
export function useTaskFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: TaskFilters = useMemo(() => {
    const sort = params.get('sort');
    return {
      search: params.get('q') ?? '',
      status: parseList(params.get('status'), STATUSES),
      priority: parseList(params.get('priority'), PRIORITIES),
      projectId: params.get('project') ?? undefined,
      overdue: params.get('overdue') === '1',
      view: params.get('view') === 'list' ? 'list' : 'board',
      sort: sort && sort in SORT_OPTIONS ? (sort as SortKey) : 'due',
      page: Math.max(1, Number(params.get('page')) || 1),
    };
  }, [params]);

  const setFilters = useCallback(
    (patch: Partial<TaskFilters>) => {
      const next = new URLSearchParams(params.toString());
      const set = (key: string, value: string | undefined) => (value ? next.set(key, value) : next.delete(key));

      if ('search' in patch) set('q', patch.search?.trim() || undefined);
      if ('status' in patch) set('status', patch.status?.join(','));
      if ('priority' in patch) set('priority', patch.priority?.join(','));
      if ('projectId' in patch) set('project', patch.projectId);
      if ('overdue' in patch) set('overdue', patch.overdue ? '1' : undefined);
      if ('view' in patch) set('view', patch.view === 'list' ? 'list' : undefined);
      if ('sort' in patch) set('sort', patch.sort === 'due' ? undefined : patch.sort);
      // Any filter change resets pagination unless a page is explicitly requested.
      set('page', patch.page && patch.page > 1 ? String(patch.page) : undefined);

      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const activeCount =
    filters.status.length + filters.priority.length + (filters.search ? 1 : 0) + (filters.overdue ? 1 : 0) + (filters.projectId ? 1 : 0);

  const clear = useCallback(
    () => setFilters({ search: '', status: [], priority: [], projectId: undefined, overdue: false }),
    [setFilters],
  );

  return { filters, setFilters, clear, activeCount };
}
