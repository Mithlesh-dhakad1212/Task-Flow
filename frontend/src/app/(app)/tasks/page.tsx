'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { TasksView } from '@/components/tasks/tasks-view';

export default function TasksPage() {
  return (
    <>
      <PageHeader title="Tasks" description="Organize tasks across all your projects and keep delivery on track." />
      <Suspense>
        <TasksView />
      </Suspense>
    </>
  );
}
