'use client';

import { ClipboardList, Columns3, List, Plus, SearchX } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useUI } from '@/context/ui-context';
import { useProjectOptions } from '@/hooks/use-projects';
import { SORT_OPTIONS, type TaskView, useTaskFilters } from '@/hooks/use-task-filters';
import { useCreateTask, useTasks, useUpdateTask } from '@/hooks/use-tasks';
import { STATUS_META } from '@/lib/constants';
import { todayISO } from '@/lib/dates';
import { type Task, type TaskInput, type TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { type BoardColumn, buildColumns } from './board-columns';
import { TaskBoard } from './task-board';
import { DeleteTaskConfirm } from './task-drawer';
import { TaskFilters } from './task-filters';
import { TaskList } from './task-list';

const BOARD_LIMIT = 200;
const LIST_LIMIT = 20;

function inDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

function BoardSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden" aria-busy="true" aria-label="Loading tasks">
      {[0, 1, 2].map((c) => (
        <div key={c} className="w-[19rem] shrink-0 space-y-2 rounded-xl bg-ink-100/60 p-2 lg:flex-1">
          <Skeleton className="h-7 w-28" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full bg-surface" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** ClickUp-style view switcher tabs. */
function ViewTabs({ view, onChange }: { view: TaskView; onChange: (v: TaskView) => void }) {
  const tabs = [
    { id: 'board' as const, label: 'Board', icon: Columns3 },
    { id: 'list' as const, label: 'List', icon: List },
  ];
  return (
    <div className="flex items-center gap-1 border-b border-ink-200/70" role="tablist" aria-label="View">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={view === id}
          onClick={() => onChange(id)}
          className={cn(
            '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition',
            view === id ? 'border-brand-600 text-brand-700 dark:text-brand-300' : 'border-transparent text-ink-500 hover:text-ink-800',
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

/**
 * Board/list of tasks with search, filters, grouping, sorting and pagination.
 * Used on /tasks (all projects) and on a project's page (`projectId` fixed).
 */
export function TasksView({ projectId }: { projectId?: string }) {
  const ui = useUI();
  const { filters, setFilters, clear, activeCount } = useTaskFilters();
  const [toDelete, setToDelete] = useState<Task | null>(null);
  const projects = useProjectOptions();

  const isBoard = filters.view === 'board';
  const sort = SORT_OPTIONS[filters.sort];
  const scopedProject = projectId ?? filters.projectId;
  // Grouping by project makes no sense inside a single project.
  const group = projectId && filters.group === 'project' ? 'status' : filters.group;

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
  const createTask = useCreateTask();

  const move = (task: Task, input: Partial<TaskInput>, message: string) =>
    updateTask.mutate({ id: task.id, input }, { onSuccess: () => toast.success(message) });

  const handlers = {
    onEdit: (task: Task) => ui.openTask(task.id),
    onDelete: (task: Task) => setToDelete(task),
    onStatusChange: (task: Task, status: TaskStatus) =>
      move(task, { status }, status === 'DONE' ? `Completed “${task.title}” 🎉` : `Moved “${task.title}” to ${STATUS_META[status].label}`),
  };

  const allProjects = projects.data?.data ?? [];
  const columns = buildColumns(group, {
    statuses: filters.status,
    projects: scopedProject ? allProjects.filter((p) => p.id === scopedProject) : allProjects,
  });

  const onQuickAdd = (column: BoardColumn, title: string) => {
    const target = column.patch.projectId ?? scopedProject ?? allProjects[0]?.id;
    if (!target) {
      ui.openCreateProject();
      return Promise.reject(new Error('No project'));
    }
    return createTask.mutateAsync({
      projectId: target,
      title,
      dueDate: inDays(7),
      status: 'TODO',
      priority: 'MEDIUM',
      ...column.patch,
    });
  };

  const tasks = query.data?.data ?? [];
  const meta = query.data?.meta;
  const newTask = () => ui.openCreateTask({ projectId: scopedProject });

  let body: ReactNode;
  if (query.isPending) {
    body = <BoardSkeleton />;
  } else if (query.isError) {
    body = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  } else if (tasks.length === 0 && activeCount > 0) {
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
  } else if (tasks.length === 0 && !isBoard) {
    body = (
      <EmptyState
        icon={ClipboardList}
        title="No tasks yet"
        description="Break your work into tasks with priorities and due dates to track progress."
        action={
          <Button onClick={newTask}>
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
          columns={columns}
          showProject={!projectId && group !== 'project'}
          showStatus={group !== 'status'}
          onMove={(task, column) => move(task, column.patch, `Moved “${task.title}” to ${column.label}`)}
          onQuickAdd={onQuickAdd}
          {...handlers}
        />
        {meta && meta.total > tasks.length && (
          <p className="mt-2 text-center text-xs text-ink-500">
            Showing {tasks.length} of {meta.total} tasks. Narrow the filters or switch to list view to see the rest.
          </p>
        )}
      </>
    );
  } else {
    body = (
      <>
        <TaskList tasks={tasks} showProject={!projectId} {...handlers} />
        {meta && <Pagination meta={meta} onPageChange={(page) => setFilters({ page })} className="mt-4" label="tasks" />}
      </>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <ViewTabs view={filters.view} onChange={(view) => setFilters({ view })} />
        <div className="flex items-center gap-3">
          <p className="hidden text-sm text-ink-500 sm:block" aria-live="polite">
            {meta ? `${meta.total} task${meta.total === 1 ? '' : 's'}` : ' '}
            {query.isFetching && !query.isPending && <span className="ml-2 text-ink-400">Syncing…</span>}
          </p>
          <Button onClick={newTask}>
            <Plus className="h-4 w-4" /> New task
          </Button>
        </div>
      </div>

      <TaskFilters
        filters={filters}
        onChange={setFilters}
        onClear={clear}
        activeCount={activeCount}
        showProjectFilter={!projectId}
      />

      {body}

      <DeleteTaskConfirm task={toDelete} open={!!toDelete} onClose={() => setToDelete(null)} />
    </div>
  );
}
