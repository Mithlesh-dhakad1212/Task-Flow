'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/endpoints';
import { daysFromToday } from '@/lib/dates';
import { queryKeys } from '@/lib/query-keys';
import { type Paginated, type Task, type TaskInput, type TaskListParams } from '@/lib/types';

export function useTasks(params: TaskListParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.tasks.list(params),
    queryFn: ({ signal }) => tasksApi.list(params, signal),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
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

type TaskLists = [readonly unknown[], Paginated<Task> | undefined][];

/**
 * Optimistic update: the board moves the card instantly, then rolls back if
 * the server rejects the change.
 */
export function useUpdateTask() {
  const qc = useQueryClient();
  const invalidate = useInvalidateTaskData();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TaskInput> }) => tasksApi.update(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: queryKeys.tasks.all });
      const snapshot = qc.getQueriesData<Paginated<Task>>({ queryKey: queryKeys.tasks.all }) as TaskLists;

      qc.setQueriesData<Paginated<Task>>({ queryKey: queryKeys.tasks.all }, (page) => {
        if (!page) return page;
        return {
          ...page,
          data: page.data.map((t) => {
            if (t.id !== id) return t;
            const next = { ...t, ...input } as Task;
            next.isOverdue = next.status !== 'DONE' && daysFromToday(next.dueDate) < 0;
            return next;
          }),
        };
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
  const invalidate = useInvalidateTaskData();
  return useMutation({ mutationFn: (id: string) => tasksApi.remove(id), onSuccess: invalidate });
}
