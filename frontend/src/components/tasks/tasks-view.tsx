'use client';

import { ClipboardList, Plus, SearchX } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { SORT_OPTIONS, useTaskFilters } from '@/hooks/use-task-filters';
import { useDeleteTask, useTasks, useUpdateTask } from '@/hooks/use-tasks';
import { STATUS_META } from '@/lib/constants';
import { type Task, type TaskStatus } from '@/lib/types';
import { TaskBoard } from './task-board';
import { TaskFilters } from './task-filters';
import { TaskFormDialog } from './task-form-dialog';
import { TaskList } from './task-list';

const BOARD_LIMIT = 200;
const LIST_LIMIT = 20;

function BoardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3" aria-busy="true" aria-label="Loading tasks">
      {[0, 1, 2].map((c) => (
        <div key={c} className="space-y-2.5 rounded-xl bg-ink-100/60 p-3">
          <Skeleton className="h-9 w-full bg-white" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full bg-white" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Board/list of tasks with search, filters, sorting and pagination.
 * Used on /tasks (all projects) and on a project's page (`projectId` fixed).
 */
export function TasksView({ projectId }: { projectId?: string }) {
  const { filters, setFilters, clear, activeCount } = useTaskFilters();
  const [formState, setFormState] = useState<{ open: boolean; task?: Task | null; status?: TaskStatus }>({
    open: false,
  });
  const [toDelete, setToDelete] = useState<Task | null>(null);

  const isBoard = filters.view === 'board';
  const sort = SORT_OPTIONS[filters.sort];
  const scopedProject = projectId ?? filters.projectId;

  const query = useTasks({
    projectId: scopedProject,
    status: filters.status,
    priority: filters.priority,
    search: filters.search || undefined,
    overdue: filters.overdue || undefined,
    sortBy: sort.sortBy,
    order: sort.order,
    page: isBoard ? 1 : filters.page,
    limit: isBoard ? BOARD_LIMIT : LIST_LIMIT,
  });

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handlers = {
    onEdit: (task: Task) => setFormState({ open: true, task }),
    onDelete: (task: Task) => setToDelete(task),
    onStatusChange: (task: Task, status: TaskStatus) =>
      updateTask.mutate(
        { id: task.id, input: { status } },
        { onSuccess: () => toast.success(`Moved “${task.title}” to ${STATUS_META[status].label}`) },
      ),
  };

  const tasks = query.data?.data ?? [];
  const meta = query.data?.meta;
  const hasFilters = activeCount > 0;

  let body: ReactNode;
  if (query.isPending) {
    body = <BoardSkeleton />;
  } else if (query.isError) {
    body = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  } else if (tasks.length === 0 && hasFilters) {
    body = (
      <EmptyState
        icon={SearchX}
        title="No tasks match your filters"
        description={
          filters.search ? (
            <>
              Nothing found for “<span className="font-medium text-ink-700">{filters.search}</span>”. Try a different
              search or remove some filters.
            </>
          ) : (
            'Try removing some filters to see more tasks.'
          )
        }
        action={
          <Button variant="secondary" onClick={clear}>
            Clear filters
          </Button>
        }
      />
    );
  } else if (tasks.length === 0) {
    body = (
      <EmptyState
        icon={ClipboardList}
        title="No tasks yet"
        description="Break your work into tasks with priorities and due dates to track progress."
        action={
          <Button onClick={() => setFormState({ open: true })}>
            <Plus className="h-4 w-4" /> Create your first task
          </Button>
        }
      />
    );
  } else if (isBoard) {
    body = (
      <>
        <TaskBoard
          tasks={tasks}
          visibleStatuses={filters.status}
          showProject={!projectId}
          onCreate={(status) => setFormState({ open: true, status })}
          {...handlers}
        />
        {meta && meta.total > tasks.length && (
          <p className="mt-4 text-center text-xs text-ink-500">
            Showing {tasks.length} of {meta.total} tasks — narrow the filters or switch to list view to see the rest.
          </p>
        )}
      </>
    );
  } else {
    body = (
      <>
        <TaskList tasks={tasks} showProject={!projectId} {...handlers} />
        {meta && (
          <Pagination meta={meta} onPageChange={(page) => setFilters({ page })} className="mt-4" label="tasks" />
        )}
      </>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-500" aria-live="polite">
          {meta ? `${meta.total} task${meta.total === 1 ? '' : 's'}` : ' '}
          {query.isFetching && !query.isPending && <span className="ml-2 text-ink-400">Updating…</span>}
        </p>
        <Button onClick={() => setFormState({ open: true })}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>

      <TaskFilters
        filters={filters}
        onChange={setFilters}
        onClear={clear}
        activeCount={activeCount}
        showProjectFilter={!projectId}
      />

      {body}

      <TaskFormDialog
        open={formState.open}
        task={formState.task}
        defaultStatus={formState.status}
        defaultProjectId={scopedProject}
        onClose={() => setFormState({ open: false })}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete task?"
        description={
          <>
            “<span className="font-medium text-ink-800">{toDelete?.title}</span>” will be permanently deleted.
          </>
        }
        loading={deleteTask.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() =>
          toDelete &&
          deleteTask.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success('Task deleted');
              setToDelete(null);
            },
          })
        }
      />
    </div>
  );
}
