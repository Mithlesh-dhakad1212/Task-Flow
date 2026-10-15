'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import { type ProjectInput, type ProjectListParams } from '@/lib/types';

export function useProjects(params: ProjectListParams) {
  return useQuery({
    queryKey: queryKeys.projects.list(params),
    queryFn: ({ signal }) => projectsApi.list(params, signal),
    placeholderData: keepPreviousData,
  });
}

/** Small helper for project pickers (task form, filters). */
export function useProjectOptions() {
  return useProjects({ sortBy: 'name', order: 'asc', limit: 100 });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: ({ signal }) => projectsApi.get(id, signal),
  });
}

function useInvalidateProjects() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
      qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ]);
}

export function useCreateProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({ mutationFn: (input: ProjectInput) => projectsApi.create(input), onSuccess: invalidate });
}

export function useUpdateProject() {
  const invalidate = useInvalidateProjects();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProjectInput> }) => projectsApi.update(id, input),
    onSuccess: async () => {
      await invalidate();
      // Task cards show the project name and colour.
      await qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: async (_data, id) => {
      qc.removeQueries({ queryKey: queryKeys.projects.detail(id) });
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
        qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
        qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
  });
}
