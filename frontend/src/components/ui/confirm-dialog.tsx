'use client';

import { type ReactNode } from 'react';
import { Button } from './button';
import { Modal } from './modal';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading} data-autofocus>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-ink-600">{description}</div>
    </Modal>
  );
}
