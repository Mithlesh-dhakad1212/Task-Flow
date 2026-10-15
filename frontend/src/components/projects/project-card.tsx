'use client';

import { AlertCircle, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ActionsMenu } from '@/components/ui/menu';
import { ProgressBar } from '@/components/ui/progress-bar';
import { PROJECT_COLORS } from '@/lib/constants';
import { formatRelative } from '@/lib/dates';
import { type Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ProjectIcon } from './project-icon';

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
  const { total, done, overdue, progress } = project.stats;

  return (
    <article className="group relative flex flex-col rounded-xl border border-ink-200/70 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift focus-within:ring-2 focus-within:ring-brand-500">
      <div className="flex items-start gap-3">
        <ProjectIcon color={project.color} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-ink-900">
            {/* Stretched link: the whole card is clickable, the menu stays independent. */}
            <Link href={`/projects/${project.id}`} className="outline-none after:absolute after:inset-0 after:content-['']">
              {project.name}
            </Link>
          </h3>
          <p className="mt-0.5 line-clamp-2 min-h-8 text-xs text-ink-500">
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
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-ink-700">
            {total === 0 ? 'No tasks yet' : `${done} of ${total} tasks completed`}
          </span>
          <span className={cn('font-bold', color.text)}>{progress}%</span>
        </div>
        <ProgressBar value={progress} barClassName={color.bar} label={`${project.name} progress`} />
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-ink-400">
        <span>Updated {formatRelative(project.updatedAt)}</span>
        {overdue > 0 && (
          <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
            <AlertCircle className="h-3 w-3" aria-hidden /> {overdue} overdue
          </span>
        )}
      </div>
    </article>
  );
}
