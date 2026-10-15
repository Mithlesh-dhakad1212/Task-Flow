'use client';

import { ArrowLeft, FolderX, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import { ProjectIcon } from '@/components/projects/project-icon';
import { TasksView } from '@/components/tasks/tasks-view';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
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
    <Link href="/projects" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800">
      <ArrowLeft className="h-3.5 w-3.5" /> All projects
    </Link>
  );

  if (project.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading project">
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="mb-6 h-10 w-72" />
        <Skeleton className="mb-6 h-24 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (project.isError) {
    // 400 = malformed id, 404 = missing or someone else's project; both look the same to the user.
    const notFound = project.error instanceof ApiError && [400, 404].includes(project.error.status);
    return (
      <>
        {back}
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
    { label: 'Total', value: p.stats.total, className: 'text-ink-900' },
    { label: 'To do', value: p.stats.todo, className: 'text-amber-600' },
    { label: 'In progress', value: p.stats.inProgress, className: 'text-brand-600' },
    { label: 'Done', value: p.stats.done, className: 'text-emerald-600' },
    { label: 'Overdue', value: p.stats.overdue, className: p.stats.overdue ? 'text-rose-600' : 'text-ink-400' },
  ];

  return (
    <>
      <PageHeader
        eyebrow={back}
        title={
          <span className="flex items-center gap-3">
            <ProjectIcon color={p.color} />
            <span className="truncate">{p.name}</span>
          </span>
        }
        description={
          <>
            {p.description || 'No description'}
            <span className="mt-1 block text-xs text-ink-400">
              Created{' '}
              {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </>
        }
      />

      <section className="mb-8 rounded-xl border border-ink-200/70 bg-white p-5 shadow-card" aria-label="Project progress">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="flex-1">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm font-medium text-ink-700">Completion</span>
              <span className={cn('text-2xl font-bold', color.text)}>{p.stats.progress}%</span>
            </div>
            <ProgressBar value={p.stats.progress} barClassName={color.bar} className="h-2.5" label="Project completion" />
          </div>
          <dl className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:w-[28rem]">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-ink-50 px-2 py-2.5 text-center">
                <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-500">{s.label}</dt>
                <dd className={cn('mt-0.5 text-lg font-bold', s.className)}>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <h2 className="mb-1 text-lg font-semibold text-ink-900">Tasks</h2>
      <Suspense>
        <TasksView projectId={p.id} />
      </Suspense>

      <ProjectFormDialog open={editOpen} project={p} onClose={() => setEditOpen(false)} />
      <DeleteProjectDialog
        project={deleteOpen ? p : null}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => router.replace('/projects')}
      />
    </>
  );
}
