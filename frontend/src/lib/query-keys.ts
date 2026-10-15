import { type ProjectListParams, type TaskListParams } from './types';

/** Hierarchical keys so a mutation can invalidate e.g. every task list at once. */
export const queryKeys = {
  me: ['me'] as const,
  dashboard: ['dashboard'] as const,
  projects: {
    all: ['projects'] as const,
    list: (params: ProjectListParams) => ['projects', 'list', params] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: (params: TaskListParams) => ['tasks', 'list', params] as const,
  },
};
