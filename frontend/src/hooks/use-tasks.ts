'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/endpoints';
import { daysFromToday } from '@/lib/dates';
import { queryKeys } from '@/lib/query-keys';
import { type Paginated, type Task, type TaskInput, type TaskListParams } from '@/lib/types';

const isPage = (v: unknown): v is Paginated<Task> => Array.isArray((v as Paginated<Task> | undefined)?.data);

export function useTasks(params: TaskListParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.tasks.list(params),
    queryFn: ({ signal }) => tasksApi.list(params, signal),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

/** Look for a task in any cached list, so the drawer can render instantly. */
function findCachedTask(qc: QueryClient, id: string): Task | undefined {
  for (const [, data] of qc.getQueriesData({ queryKey: queryKeys.tasks.all })) {
    if (isPage(data)) {
      const hit = data.data.find((t) => t.id === id);
      if (hit) return hit;
    }
  }
  return undefined;
}

export function useTask(id: string | null) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: queryKeys.tasks.detail(id ?? ''),
    queryFn: ({ signal }) => tasksApi.get(id!, signal),
    enabled: !!id,
    initialData: () => (id ? findCachedTask(qc, id) : undefined),
    // Treat cached list data as stale so the full record is fetched in the background.
    initialDataUpdatedAt: 0,
  });
}

/** Everything derived from tasks must refresh after a task changes. */
function useInvalidateTaskData() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
      qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
      qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ]);
}

export function useCreateTask() {
  const invalidate = useInvalidateTaskData();
  return useMutation({ mutationFn: (input: TaskInput) => tasksApi.create(input), onSuccess: invalidate });
}

function applyPatch(task: Task, input: Partial<TaskInput>): Task {
  const next = { ...task, ...input } as Task;
  next.isOverdue = next.status !== 'DONE' && daysFromToday(next.dueDate) < 0;
  return next;
}

/**
 * Optimistic update: board cards, list rows and the open drawer change
 * instantly, then roll back if the server rejects the change.
 */
export function useUpdateTask() {
  const qc = useQueryClient();
  const invalidate = useInvalidateTaskData();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TaskInput> }) => tasksApi.update(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: queryKeys.tasks.all });
      const snapshot = qc.getQueriesData({ queryKey: queryKeys.tasks.all });

      qc.setQueriesData({ queryKey: queryKeys.tasks.all }, (data: unknown) => {
        if (isPage(data)) {
          return { ...data, data: data.data.map((t) => (t.id === id ? applyPatch(t, input) : t)) };
        }
        const task = data as Task | undefined;
        return task?.id === id ? applyPatch(task, input) : data;
      });
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: invalidate,
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const invalidate = useInvalidateTaskData();
  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: async (_d, id) => {
      qc.removeQueries({ queryKey: queryKeys.tasks.detail(id) });
      await invalidate();
    },
  });
}
