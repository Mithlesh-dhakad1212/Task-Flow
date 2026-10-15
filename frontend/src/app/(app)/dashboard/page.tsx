'use client';

import { AlertTriangle, CheckCircle2, FolderKanban, ListTodo, Plus } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/dashboard/stat-card';
import { StatusDonut } from '@/components/dashboard/status-donut';
import { TaskMiniList } from '@/components/dashboard/task-mini-list';
import { PageHeader } from '@/components/layout/page-header';
import { ProjectIcon } from '@/components/projects/project-icon';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useAuth } from '@/context/auth-context';
import { useDashboard } from '@/hooks/use-dashboard';
import { PROJECT_COLORS } from '@/lib/constants';
import { greeting } from '@/lib/dates';
import { cn, pluralize } from '@/lib/utils';

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-80 rounded-xl lg:col-span-3" />
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isPending, isError, error, refetch } = useDashboard();
  const firstName = user?.name.split(' ')[0] ?? '';

  const header = (
    <PageHeader
      title={`${greeting()}, ${firstName}!`}
      description="Here's what's happening with your projects today."
      actions={
        <Link href="/tasks" className={buttonVariants({ variant: 'secondary' })}>
          View all tasks
        </Link>
      }
    />
  );

  if (isPending) {
    return (
      <>
        {header}
        <DashboardSkeleton />
      </>
    );
  }
  if (isError) {
    return (
      <>
        {header}
        <ErrorState error={error} onRetry={() => void refetch()} />
      </>
    );
  }

  const { totals, projects, upcoming, overdue } = data;

  if (totals.projects === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={FolderKanban}
          title="Welcome to TaskFlow"
          description="Create your first project, add some tasks, and your progress will show up here."
          action={
            <Link href="/projects?new=1" className={buttonVariants()}>
              <Plus className="h-4 w-4" /> Create a project
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      {header}

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total projects" value={totals.projects} hint="Across your workspace" icon={FolderKanban} tone="brand" href="/projects" />
        <StatCard label="Total tasks" value={totals.tasks} hint={`${totals.todo} to do · ${totals.inProgress} in progress`} icon={ListTodo} tone="violet" href="/tasks" />
        <StatCard label="Completed" value={totals.completed} hint={`${totals.completionRate}% completion rate`} icon={CheckCircle2} tone="emerald" href="/tasks?status=DONE&view=list" />
        <StatCard
          label="Overdue"
          value={totals.overdue}
          hint={totals.dueToday ? `${pluralize(totals.dueToday, 'task')} due today` : 'Past due and not done'}
          icon={AlertTriangle}
          tone="rose"
          href="/tasks?overdue=1&view=list"
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Project progress"
            subtitle="Completion across your most active projects"
            action={
              <Link href="/projects" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View all
              </Link>
            }
          />
          <ul className="space-y-5 p-5">
            {projects.map((p) => {
              const color = PROJECT_COLORS[p.color] ?? PROJECT_COLORS.blue;
              return (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}`} className="group flex items-center gap-3">
                    <ProjectIcon color={p.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-ink-900 group-hover:text-brand-700">{p.name}</p>
                        <span className={cn('text-xs font-bold', color.text)}>{p.stats.progress}%</span>
                      </div>
                      <ProgressBar value={p.stats.progress} barClassName={color.bar} label={`${p.name} progress`} />
                      <p className="mt-1 text-[11px] text-ink-500">
                        {p.stats.done} of {pluralize(p.stats.total, 'task')}
                        {p.stats.overdue > 0 && <span className="font-semibold text-rose-600"> · {p.stats.overdue} overdue</span>}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Tasks by status" subtitle={`${pluralize(totals.tasks, 'task')} in total`} />
          <div className="p-5">
            <StatusDonut
              counts={{ DONE: totals.completed, IN_PROGRESS: totals.inProgress, TODO: totals.todo }}
              completionRate={totals.completionRate}
            />
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Up next" subtitle="Open tasks due soonest" />
          <div className="pb-2 pt-3">
            <TaskMiniList tasks={upcoming} empty="Nothing scheduled — you're all caught up." />
          </div>
        </Card>

        <Card className={cn('lg:col-span-2', overdue.length > 0 && 'border-rose-200')}>
          <CardHeader
            title="Overdue"
            subtitle="Past their due date and not done"
            action={
              overdue.length > 0 && (
                <Link href="/tasks?overdue=1&view=list" className="text-xs font-semibold text-rose-600 hover:text-rose-700">
                  View all
                </Link>
              )
            }
          />
          <div className="pb-2 pt-3">
            <TaskMiniList tasks={overdue} empty="No overdue tasks. Nice work!" />
          </div>
        </Card>
      </div>
    </>
  );
}
