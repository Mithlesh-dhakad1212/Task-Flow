'use client';

import { AlertTriangle, CheckCircle2, Columns3, FolderKanban, ListTodo, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { PriorityBars } from '@/components/dashboard/priority-bars';
import { StatCard } from '@/components/dashboard/stat-card';
import { StatusDonut } from '@/components/dashboard/status-donut';
import { TaskMiniList } from '@/components/dashboard/task-mini-list';
import { ProjectIcon } from '@/components/projects/project-icon';
import { Card, CardHeader } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useAuth } from '@/context/auth-context';
import { useUI } from '@/context/ui-context';
import { useDashboard } from '@/hooks/use-dashboard';
import { PROJECT_COLORS } from '@/lib/constants';
import { greeting } from '@/lib/dates';
import { type DashboardSummary } from '@/lib/types';
import { cn, pluralize } from '@/lib/utils';

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-40 rounded-3xl" />
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

function summarySentence(t: DashboardSummary['totals']): string {
  if (t.tasks === 0) return 'Add a few tasks and your progress will show up here.';
  const parts: string[] = [];
  if (t.dueToday) parts.push(`${pluralize(t.dueToday, 'task')} due today`);
  if (t.overdue) parts.push(`${t.overdue} overdue`);
  if (parts.length === 0) return `Nothing urgent. You've completed ${t.completionRate}% of your tasks.`;
  return `You have ${parts.join(' and ')}. ${t.completionRate}% of all tasks are done.`;
}

function Hero({ name, totals }: { name: string; totals?: DashboardSummary['totals'] }) {
  const ui = useUI();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-7 text-white shadow-glow sm:px-8">
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10" aria-hidden />
      <div className="pointer-events-none absolute -bottom-28 right-40 h-56 w-56 rounded-full bg-white/5" aria-hidden />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/70">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> {today}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting()}, {name}!
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-white/80">{totals ? summarySentence(totals) : 'Loading your workspace…'}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => ui.openCreateTask()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-white/90"
            >
              <Plus className="h-4 w-4" aria-hidden /> New task
            </button>
            <Link
              href="/tasks"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/15 px-3.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 transition hover:bg-white/25"
            >
              <Columns3 className="h-4 w-4" aria-hidden /> Open board
            </Link>
          </div>
        </div>
        {totals && totals.tasks > 0 && (
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-inset ring-white/20 backdrop-blur">
            <div className="relative h-16 w-16">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${(totals.completionRate / 100) * 97.4} 97.4`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{totals.completionRate}%</span>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {totals.completed}
                <span className="text-base font-medium text-white/70"> / {totals.tasks}</span>
              </p>
              <p className="text-xs text-white/70">tasks completed</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const ui = useUI();
  const { data, isPending, isError, error, refetch } = useDashboard();
  const firstName = user?.name.split(' ')[0] ?? '';

  if (isPending) return <DashboardSkeleton />;
  if (isError) {
    return (
      <>
        <Hero name={firstName} />
        <ErrorState className="mt-6" error={error} onRetry={() => void refetch()} />
      </>
    );
  }

  const { totals, projects, upcoming, overdue, activity, openByPriority } = data;

  if (totals.projects === 0) {
    return (
      <>
        <Hero name={firstName} totals={totals} />
        <EmptyState
          className="mt-6"
          icon={FolderKanban}
          title="Welcome to TaskFlow"
          description="Create your first project, add some tasks, and your progress will show up here."
          action={
            <button
              type="button"
              onClick={ui.openCreateProject}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Create a project
            </button>
          }
        />
      </>
    );
  }

  const completedRecently = activity.reduce((n, d) => n + d.completed, 0);

  return (
    <div className="space-y-6">
      <Hero name={firstName} totals={totals} />

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total projects" value={totals.projects} hint="Active in your workspace" icon={FolderKanban} tone="brand" href="/projects" />
        <StatCard
          label="Total tasks"
          value={totals.tasks}
          hint={`${totals.todo} to do · ${totals.inProgress} in progress`}
          icon={ListTodo}
          tone="blue"
          href="/tasks"
        />
        <StatCard
          label="Completed tasks"
          value={totals.completed}
          hint={`${totals.completionRate}% completion rate`}
          icon={CheckCircle2}
          tone="emerald"
          href="/tasks?status=DONE&view=list"
        />
        <StatCard
          label="Overdue tasks"
          value={totals.overdue}
          hint={totals.dueToday ? `${pluralize(totals.dueToday, 'task')} due today` : 'Past due and not done'}
          icon={AlertTriangle}
          tone="rose"
          href="/tasks?overdue=1&view=list"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Completed tasks"
            subtitle={`${pluralize(completedRecently, 'task')} completed in the last 14 days`}
          />
          <div className="px-5 pb-4 pt-6">
            <ActivityChart data={activity} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Tasks by status" subtitle={`${pluralize(totals.tasks, 'task')} in total`} />
          <div className="p-5">
            <StatusDonut
              counts={{ DONE: totals.completed, IN_PROGRESS: totals.inProgress, TODO: totals.todo }}
              completionRate={totals.completionRate}
            />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Project progress"
            subtitle="Completion across your most active projects"
            action={
              <Link href="/projects" className="text-xs font-semibold text-brand-600 hover:underline">
                View all
              </Link>
            }
          />
          <ul className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
            {projects.map((p) => {
              const color = PROJECT_COLORS[p.color] ?? PROJECT_COLORS.blue;
              return (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}`} className="group flex items-center gap-3">
                    <ProjectIcon color={p.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-ink-900 group-hover:text-brand-600">{p.name}</p>
                        <span className="text-xs font-bold tabular-nums text-ink-700">{p.stats.progress}%</span>
                      </div>
                      <ProgressBar value={p.stats.progress} barClassName={color.bar} label={`${p.name} progress`} />
                      <p className="mt-1 text-[11px] text-ink-500">
                        {p.stats.done} of {pluralize(p.stats.total, 'task')}
                        {p.stats.overdue > 0 && (
                          <span className="font-semibold text-rose-600 dark:text-rose-400"> · {p.stats.overdue} overdue</span>
                        )}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Open by priority" subtitle="What's still on the table" />
          <div className="p-5">
            <PriorityBars counts={openByPriority} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Up next" subtitle="Open tasks due soonest" />
          <div className="pb-2 pt-3">
            <TaskMiniList tasks={upcoming} empty="Nothing scheduled. You're all caught up." />
          </div>
        </Card>
        <Card className={cn(overdue.length > 0 && 'border-rose-500/30')}>
          <CardHeader
            title="Overdue"
            subtitle="Past their due date and not done"
            action={
              overdue.length > 0 && (
                <Link href="/tasks?overdue=1&view=list" className="text-xs font-semibold text-rose-600 hover:underline">
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
    </div>
  );
}
