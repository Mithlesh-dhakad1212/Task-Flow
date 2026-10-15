'use client';

import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useDeleteProject } from '@/hooks/use-projects';
import { type Project } from '@/lib/types';
import { pluralize } from '@/lib/utils';

export function DeleteProjectDialog({
  project,
  onClose,
  onDeleted,
}: {
  project: Project | null;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const remove = useDeleteProject();
  return (
    <ConfirmDialog
      open={!!project}
      title="Delete project?"
      confirmLabel="Delete project"
      loading={remove.isPending}
      onClose={onClose}
      onConfirm={() =>
        project &&
        remove.mutate(project.id, {
          onSuccess: () => {
            toast.success(`Deleted “${project.name}”`);
            onClose();
            onDeleted?.();
          },
        })
      }
      description={
        project && (
          <>
            <span className="font-medium text-ink-800">{project.name}</span>
            {project.stats.total > 0 ? (
              <> and its {pluralize(project.stats.total, 'task')} will be permanently deleted.</>
            ) : (
              ' will be permanently deleted.'
            )}{' '}
            This can&apos;t be undone.
          </>
        )
      }
    />
  );
}
