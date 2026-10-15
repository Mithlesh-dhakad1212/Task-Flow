'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/form-controls';
import { Modal } from '@/components/ui/modal';
import { useCreateProject, useUpdateProject } from '@/hooks/use-projects';
import { ApiError } from '@/lib/api/client';
import { PROJECT_COLORS, PROJECT_COLOR_KEYS } from '@/lib/constants';
import { type Project, type ProjectColor } from '@/lib/types';
import { cn } from '@/lib/utils';
import { projectSchema, type ProjectFormValues } from '@/lib/validation';

export function ProjectFormDialog({
  open,
  onClose,
  project,
}: {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
}) {
  const isEdit = !!project;
  const router = useRouter();
  const create = useCreateProject();
  const update = useUpdateProject();
  const pending = create.isPending || update.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProjectFormValues>({ resolver: zodResolver(projectSchema) });

  useEffect(() => {
    if (open) {
      reset({
        name: project?.name ?? '',
        description: project?.description ?? '',
        color: project?.color ?? PROJECT_COLOR_KEYS[Math.floor(Math.random() * PROJECT_COLOR_KEYS.length)],
      });
    }
  }, [open, project, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const input = { ...values, color: values.color as ProjectColor };
    try {
      if (isEdit) {
        await update.mutateAsync({ id: project.id, input });
        toast.success('Project updated');
        onClose();
      } else {
        const created = await create.mutateAsync(input);
        toast.success('Project created');
        onClose();
        router.push(`/projects/${created.id}`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        for (const d of err.details) setError(d.field as keyof ProjectFormValues, { message: d.messages[0] });
      }
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit project' : 'New project'}
      description={isEdit ? undefined : 'Projects group related tasks and track their progress.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" loading={pending}>
            {isEdit ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Name" error={errors.name?.message}>
          <Input placeholder="e.g. Website Redesign" data-autofocus {...register('name')} />
        </Field>
        <Field label="Description" error={errors.description?.message} hint="Optional — what is this project about?">
          <Textarea rows={3} placeholder="Goals, scope or useful links…" {...register('description')} />
        </Field>
        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-ink-800">Color</legend>
          <Controller
            control={control}
            name="color"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Project color">
                {PROJECT_COLOR_KEYS.map((key) => {
                  const selected = field.value === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={PROJECT_COLORS[key].label}
                      onClick={() => field.onChange(key)}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-white transition',
                        PROJECT_COLORS[key].swatch,
                        selected ? 'ring-2 ring-ink-900 ring-offset-2' : 'hover:scale-110',
                      )}
                    >
                      {selected && <Check className="h-4 w-4" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </fieldset>
      </form>
    </Modal>
  );
}
