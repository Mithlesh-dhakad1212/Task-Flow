'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/form-controls';
import { Modal } from '@/components/ui/modal';
import { useProjectOptions } from '@/hooks/use-projects';
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks';
import { ApiError } from '@/lib/api/client';
import { PRIORITIES, PRIORITY_META, STATUSES, STATUS_META } from '@/lib/constants';
import { todayISO } from '@/lib/dates';
import { type Task, type TaskStatus } from '@/lib/types';
import { taskSchema, type TaskFormValues } from '@/lib/validation';

function inDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

export function TaskFormDialog({
  open,
  onClose,
  task,
  defaultProjectId,
  defaultStatus = 'TODO',
}: {
  open: boolean;
  onClose: () => void;
  /** When provided the dialog edits this task; otherwise it creates one. */
  task?: Task | null;
  defaultProjectId?: string;
  defaultStatus?: TaskStatus;
}) {
  const isEdit = !!task;
  const projects = useProjectOptions();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const pending = createTask.isPending || updateTask.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TaskFormValues>({ resolver: zodResolver(taskSchema) });

  useEffect(() => {
    if (!open) return;
    reset(
      task
        ? {
            projectId: task.projectId,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
          }
        : {
            projectId: defaultProjectId ?? projects.data?.data[0]?.id ?? '',
            title: '',
            description: '',
            status: defaultStatus,
            priority: 'MEDIUM',
            dueDate: inDays(7),
          },
    );
    // Only re-initialise when the dialog opens or the target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id, defaultProjectId, defaultStatus, projects.isSuccess]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit) {
        await updateTask.mutateAsync({ id: task.id, input: values });
        toast.success('Task updated');
      } else {
        await createTask.mutateAsync(values);
        toast.success('Task created');
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        for (const d of err.details) setError(d.field as keyof TaskFormValues, { message: d.messages[0] });
      }
    }
  });

  const noProjects = projects.isSuccess && projects.data.data.length === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'New task'}
      description={isEdit ? undefined : 'Add a task to one of your projects.'}
      footer={
        !noProjects && (
          <>
            <Button variant="secondary" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" form="task-form" loading={pending}>
              {isEdit ? 'Save changes' : 'Create task'}
            </Button>
          </>
        )
      }
    >
      {noProjects ? (
        <div className="py-4 text-center text-sm text-ink-600">
          You need a project before you can add tasks.{' '}
          <Link href="/projects?new=1" className="font-semibold text-brand-600 hover:underline" onClick={onClose}>
            Create a project
          </Link>
        </div>
      ) : (
        <form id="task-form" onSubmit={onSubmit} noValidate className="space-y-4">
          <Field label="Title" error={errors.title?.message}>
            <Input placeholder="e.g. Design homepage" data-autofocus {...register('title')} />
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <Textarea placeholder="Add details, links or acceptance criteria…" rows={3} {...register('description')} />
          </Field>
          <Field label="Project" error={errors.projectId?.message}>
            <Select {...register('projectId')} disabled={projects.isLoading}>
              {projects.data?.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Status" error={errors.status?.message}>
              <Select {...register('status')}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority" error={errors.priority?.message}>
              <Select {...register('priority')}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_META[p].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Due date" error={errors.dueDate?.message}>
              <Input type="date" {...register('dueDate')} />
            </Field>
          </div>
        </form>
      )}
    </Modal>
  );
}
