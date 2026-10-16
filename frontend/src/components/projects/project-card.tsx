'use client';

import { AlertCircle, CalendarPlus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ActionsMenu } from '@/components/ui/menu';
import { PROJECT_COLORS, STATUS_META } from '@/lib/constants';
import { formatRelative } from '@/lib/dates';
import { type Project, type TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ProjectIcon } from './project-icon';

/** Segmented bar: done / in progress / to do, separated by small gaps. */
function StatusBar({ stats }: { stats: Project['stats'] }) {
  const parts: [TaskStatus, number][] = [
    ['DONE', stats.done],
    ['IN_PROGRESS', stats.inProgress],
    ['TODO', stats.todo],
  ];
  if (stats.total === 0) return <div className="h-2 rounded-full bg-ink-100" aria-hidden />;
  return (
    <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-ink-100" aria-hidden>
      {parts.map(([s, n]) =>
        n > 0 ? <div key={s} className={cn('h-full first:rounded-l-full last:rounded-r-full', STATUS_META[s].dot)} style={{ width: `${(n / stats.total) * 100}%` }} /> : null,
      )}
    </div>
  );
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
}) {
  const color = PROJECT_COLORS[project.color] ?? PROJECT_COLORS.blue;
  const { total, done, inProgress, todo, overdue, progress } = project.stats;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-lift focus-within:ring-2 focus-within:ring-brand-500">
      <div className={cn('h-1.5 bg-gradient-to-r', color.gradient)} aria-hidden />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <ProjectIcon color={project.color} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-ink-900">
              {/* Stretched link: the whole card is clickable, the menu stays independent. */}
              <Link href={`/projects/${project.id}`} className="outline-none after:absolute after:inset-0 after:content-['']">
                {project.name}
              </Link>
            </h3>
            <p className="mt-0.5 line-clamp-2 min-h-10 text-sm text-ink-500">
              {project.description || <span className="italic text-ink-400">No description</span>}
            </p>
          </div>
          <div className="relative z-10 -mr-2 -mt-1">
            <ActionsMenu
              label={`Actions for ${project.name}`}
              items={[
                { label: 'Edit', icon: Pencil, onSelect: () => onEdit(project) },
                { label: 'Delete', icon: Trash2, onSelect: () => onDelete(project), danger: true },
              ]}
            />
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-medium text-ink-700">
              {total === 0 ? 'No tasks yet' : `${done} of ${total} tasks completed`}
            </span>
            <span className={cn('text-lg font-bold tabular-nums', color.text)}>{progress}%</span>
          </div>
          <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${project.name} progress`}>
            <StatusBar stats={project.stats} />
          </div>
          {total > 0 && (
            <dl className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-500">
              {(
                [
                  ['TODO', todo],
                  ['IN_PROGRESS', inProgress],
                  ['DONE', done],
                ] as const
              ).map(([s, n]) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_META[s].dot)} aria-hidden />
                  <dt>{STATUS_META[s].label}</dt>
                  <dd className="font-semibold tabular-nums text-ink-700">{n}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-3 text-[11px] text-ink-400">
          <span className="flex items-center gap-1" title={`Created ${new Date(project.createdAt).toLocaleDateString()}`}>
            <CalendarPlus className="h-3 w-3" aria-hidden />
            Created {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {overdue > 0 ? (
            <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-3 w-3" aria-hidden /> {overdue} overdue
            </span>
          ) : (
            <span>Updated {formatRelative(project.updatedAt)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
