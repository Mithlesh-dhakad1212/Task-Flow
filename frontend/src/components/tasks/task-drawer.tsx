'use client';

import { CalendarDays, Check, CircleDot, Flag, FolderKanban, Link2, Loader2, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Select } from '@/components/ui/form-controls';
import { ErrorState } from '@/components/ui/states';
import { Skeleton } from '@/components/ui/skeleton';
import { useUI } from '@/context/ui-context';
import { useProjectOptions } from '@/hooks/use-projects';
import { useDeleteTask, useTask, useUpdateTask } from '@/hooks/use-tasks';
import { ApiError } from '@/lib/api/client';
import { PRIORITIES, PRIORITY_META, PROJECT_COLORS, STATUSES, STATUS_META } from '@/lib/constants';
import { formatRelative } from '@/lib/dates';
import { type Task, type TaskInput } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DueChip, StatusCheck } from './task-bits';

/** Reads ?task=<id> from the URL so any task view is shareable. */
export function TaskDrawerHost() {
  const params = useSearchParams();
  const id = params.get('task');
  const { closeTask } = useUI();
  return id ? <TaskDrawer id={id} onClose={closeTask} /> : null;
}

function Row({ icon: Icon, label, children }: { icon: typeof Flag; label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-center gap-3 py-1.5">
      <span className="flex items-center gap-2 text-xs font-medium text-ink-500">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Textarea that grows with its content. */
function AutoTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [props.value]);
  return <textarea ref={ref} rows={1} {...props} />;
}

function TaskDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const query = useTask(id);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Let a dialog opened on top of the drawer (e.g. delete confirmation) handle Escape itself.
      const stacked = Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"]')).some(
        (el) => el !== panelRef.current,
      );
      if (!stacked) onClose();
    };
    document.addEventListener('keydown', onKey);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const notFound = query.error instanceof ApiError && [400, 404].includes(query.error.status);

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 animate-fade-in bg-black/30" onClick={onClose} aria-hidden />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-xl animate-slide-in-right flex-col bg-surface shadow-lift outline-none sm:border-l sm:border-ink-200"
      >
        {query.data ? (
          <DrawerBody task={query.data} titleId={titleId} onClose={onClose} onDelete={() => setConfirmDelete(true)} />
        ) : query.isError ? (
          <div className="p-6">
            <DrawerTopBar onClose={onClose} />
            {notFound ? (
              <div className="py-16 text-center">
                <h2 id={titleId} className="font-semibold text-ink-900">Task not found</h2>
                <p className="mt-1 text-sm text-ink-500">It may have been deleted, or you don&apos;t have access to it.</p>
              </div>
            ) : (
              <ErrorState error={query.error} onRetry={() => void query.refetch()} />
            )}
          </div>
        ) : (
          <div className="space-y-4 p-6" aria-busy="true">
            <span id={titleId} className="sr-only">Loading task</span>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}
      </aside>
      {query.data && (
        <DeleteTaskConfirm task={query.data} open={confirmDelete} onClose={() => setConfirmDelete(false)} onDeleted={onClose} />
      )}
    </div>,
    document.body,
  );
}

function DrawerTopBar({ onClose, children }: { onClose: () => void; children?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1">{children}</div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-800"
        aria-label="Close task"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function DrawerBody({
  task,
  titleId,
  onClose,
  onDelete,
}: {
  task: Task;
  titleId: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  const update = useUpdateTask();
  const projects = useProjectOptions();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const color = PROJECT_COLORS[task.project.color] ?? PROJECT_COLORS.blue;

  // Re-sync local drafts when the server copy changes (e.g. edited elsewhere).
  useEffect(() => setTitle(task.title), [task.title]);
  useEffect(() => setDescription(task.description), [task.description]);

  const save = (input: Partial<TaskInput>) => update.mutate({ id: task.id, input });

  const commitTitle = () => {
    const next = title.trim();
    if (!next) {
      setTitle(task.title);
      toast.error('A task needs a title');
    } else if (next !== task.title) {
      save({ title: next });
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <>
      <div className="border-b border-ink-100 px-6 pb-4 pt-5">
        <DrawerTopBar onClose={onClose}>
          <div className="flex items-center gap-2 text-xs text-ink-500">
            <Link
              href={`/projects/${task.projectId}`}
              onClick={onClose}
              className={cn('inline-flex max-w-[14rem] items-center gap-1.5 truncate rounded-md px-2 py-1 font-medium', color.soft)}
            >
              <FolderKanban className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{task.project.name}</span>
            </Link>
            <span aria-live="polite" className="inline-flex items-center gap-1 text-ink-400">
              {update.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Saving…
                </>
              ) : update.isSuccess ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" aria-hidden /> Saved
                </>
              ) : null}
            </span>
          </div>
        </DrawerTopBar>

        <div className="flex items-start gap-3">
          <div className="pt-2">
            <StatusCheck
              status={task.status}
              label={task.title}
              onToggle={() => save({ status: task.status === 'DONE' ? 'TODO' : 'DONE' })}
            />
          </div>
          <h2 id={titleId} className="flex-1">
            <label htmlFor={`${titleId}-title`} className="sr-only">
              Task title
            </label>
            <AutoTextarea
              id={`${titleId}-title`}
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              className={cn(
                'w-full resize-none rounded-lg border-0 bg-transparent px-2 py-1 text-xl font-bold leading-snug text-ink-900 transition hover:bg-ink-50 focus:bg-ink-50 focus:ring-2 focus:ring-brand-500',
                task.status === 'DONE' && 'text-ink-500 line-through decoration-ink-300',
              )}
            />
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
        <Row icon={CircleDot} label="Status">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Status">
            {STATUSES.map((s) => {
              const active = task.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => !active && save({ status: s })}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition',
                    active ? STATUS_META[s].pill : 'bg-ink-100 text-ink-500 hover:bg-ink-200 hover:text-ink-800',
                  )}
                >
                  {STATUS_META[s].label}
                </button>
              );
            })}
          </div>
        </Row>
        <Row icon={Flag} label="Priority">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Priority">
            {PRIORITIES.map((p) => {
              const active = task.priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => !active && save({ priority: p })}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition',
                    active ? PRIORITY_META[p].badge : 'text-ink-500 ring-ink-200 hover:bg-ink-50',
                  )}
                >
                  <Flag className={cn('h-3 w-3', PRIORITY_META[p].flag)} aria-hidden />
                  {PRIORITY_META[p].label}
                </button>
              );
            })}
          </div>
        </Row>
        <Row icon={CalendarDays} label="Due date">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              aria-label="Due date"
              value={task.dueDate}
              onChange={(e) => e.target.value && save({ dueDate: e.target.value })}
              className="h-8 rounded-md border-0 bg-surface px-2 text-sm text-ink-800 ring-1 ring-inset ring-ink-200 focus:ring-2 focus:ring-brand-500"
            />
            <DueChip task={task} />
          </div>
        </Row>
        <Row icon={FolderKanban} label="Project">
          <Select
            aria-label="Project"
            value={task.projectId}
            onChange={(e) => save({ projectId: e.target.value })}
            className="h-8 max-w-xs text-sm"
          >
            {(projects.data?.data ?? [task.project]).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Row>

        <div className="mt-6">
          <label htmlFor={`${titleId}-desc`} className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-500">
            Description
          </label>
          <AutoTextarea
            id={`${titleId}-desc`}
            value={description}
            maxLength={5000}
            placeholder="Add more detail, links or acceptance criteria…"
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => description.trim() !== task.description && save({ description: description.trim() })}
            className="min-h-32 w-full resize-none rounded-lg border-0 bg-ink-50/70 px-3 py-2.5 text-sm leading-relaxed text-ink-800 ring-1 ring-inset ring-ink-200/70 placeholder:text-ink-400 focus:bg-surface focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-ink-100 px-6 py-3 text-[11px] text-ink-400">
        <span>
          Created {formatRelative(task.createdAt)} · Updated {formatRelative(task.updatedAt)}
          {task.completedAt && <> · Completed {formatRelative(task.completedAt)}</>}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void copyLink()}
            className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-800"
            aria-label="Copy link to task"
            title="Copy link"
          >
            <Link2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-1.5 text-ink-400 hover:bg-rose-500/10 hover:text-rose-600"
            aria-label="Delete task"
            title="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export function DeleteTaskConfirm({
  task,
  open,
  onClose,
  onDeleted,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const remove = useDeleteTask();
  return (
    <ConfirmDialog
      open={open}
      title="Delete task?"
      description={
        <>
          “<span className="font-medium text-ink-800">{task?.title}</span>” will be permanently deleted.
        </>
      }
      loading={remove.isPending}
      onClose={onClose}
      onConfirm={() =>
        task &&
        remove.mutate(task.id, {
          onSuccess: () => {
            toast.success('Task deleted');
            onClose();
            onDeleted?.();
          },
        })
      }
    />
  );
}
