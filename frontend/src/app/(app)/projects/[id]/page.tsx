'use client';

import { ArrowLeft, CalendarPlus, FolderX, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import { TasksView } from '@/components/tasks/tasks-view';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useProject } from '@/hooks/use-projects';
import { ApiError } from '@/lib/api/client';
import { PROJECT_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const project = useProject(id);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const back = (
    <Link href="/projects" className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800">
      <ArrowLeft className="h-3.5 w-3.5" /> All projects
    </Link>
  );

  if (project.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading project">
        <Skeleton className="mb-6 h-44 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (project.isError) {
    // 400 = malformed id, 404 = missing or someone else's project; both look the same to the user.
    const notFound = project.error instanceof ApiError && [400, 404].includes(project.error.status);
    return (
      <>
        <div className="mb-4">{back}</div>
        {notFound ? (
          <EmptyState
            icon={FolderX}
            title="Project not found"
            description="It may have been deleted, or you don't have access to it."
            action={<Button onClick={() => router.push('/projects')}>Back to projects</Button>}
          />
        ) : (
          <ErrorState error={project.error} onRetry={() => void project.refetch()} />
        )}
      </>
    );
  }

  const p = project.data;
  const color = PROJECT_COLORS[p.color] ?? PROJECT_COLORS.blue;
  const stats = [
    { label: 'Total', value: p.stats.total },
    { label: 'To do', value: p.stats.todo },
    { label: 'In progress', value: p.stats.inProgress },
    { label: 'Done', value: p.stats.done },
    { label: 'Overdue', value: p.stats.overdue },
  ];

  return (
    <>
      <div className="mb-3">{back}</div>
      <section className={cn('relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-lift sm:p-8', color.gradient)}>
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{p.name}</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-white/85">{p.description || 'No description'}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-white/70">
              <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
              Created {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/15 px-3 text-xs font-semibold ring-1 ring-inset ring-white/25 transition hover:bg-white/25"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/15 px-3 text-xs font-semibold ring-1 ring-inset ring-white/25 transition hover:bg-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
              </button>
            </div>
          </div>

          <div className="w-full shrink-0 rounded-2xl bg-white/10 p-4 ring-1 ring-inset ring-white/20 backdrop-blur lg:w-[26rem]">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm font-medium text-white/85">Completion</span>
              <span className="text-2xl font-bold tabular-nums">{p.stats.progress}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-white/20"
              role="progressbar"
              aria-valuenow={p.stats.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Project completion"
            >
              <div className="h-full rounded-full bg-white transition-[width] duration-700" style={{ width: `${p.stats.progress}%` }} />
            </div>
            <dl className="mt-4 grid grid-cols-5 gap-1 text-center">
              {stats.map((s) => (
                <div key={s.label}>
                  <dd className="text-lg font-bold tabular-nums">{s.value}</dd>
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-white/70">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <Suspense>
        <TasksView projectId={p.id} />
      </Suspense>

      <ProjectFormDialog open={editOpen} project={p} onClose={() => setEditOpen(false)} />
      <DeleteProjectDialog project={deleteOpen ? p : null} onClose={() => setDeleteOpen(false)} onDeleted={() => router.replace('/projects')} />
    </>
  );
}
