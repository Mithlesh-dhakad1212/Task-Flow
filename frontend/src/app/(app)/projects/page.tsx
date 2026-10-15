'use client';

import { FolderPlus, Plus, SearchX } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/form-controls';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useProjects } from '@/hooks/use-projects';
import { type Project, type ProjectListParams } from '@/lib/types';

const SORTS = {
  updated: { label: 'Recently updated', sortBy: 'updatedAt', order: 'desc' },
  created: { label: 'Newest', sortBy: 'createdAt', order: 'desc' },
  name: { label: 'Name (A–Z)', sortBy: 'name', order: 'asc' },
} as const;
type SortKey = keyof typeof SORTS;

const PAGE_SIZE = 12;

function ProjectsPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('updated');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ open: boolean; project?: Project | null }>({ open: false });
  const [deleting, setDeleting] = useState<Project | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim());

  // `/projects?new=1` (linked from empty states elsewhere) opens the create dialog.
  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing({ open: true });
      router.replace('/projects', { scroll: false });
    }
  }, [params, router]);

  useEffect(() => setPage(1), [debouncedSearch, sort]);

  const listParams: ProjectListParams = {
    search: debouncedSearch || undefined,
    sortBy: SORTS[sort].sortBy,
    order: SORTS[sort].order,
    page,
    limit: PAGE_SIZE,
  };
  const query = useProjects(listParams);
  const projects = query.data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Projects"
        description="Manage your projects and track their progress."
        actions={
          <Button onClick={() => setEditing({ open: true })}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-2 rounded-xl border border-ink-200/70 bg-white p-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          label="Search projects"
          placeholder="Search projects…"
          className="sm:w-72"
        />
        <Select
          aria-label="Sort projects"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="sm:w-52"
        >
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>
              Sort: {s.label}
            </option>
          ))}
        </Select>
      </div>

      {query.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading projects">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : projects.length === 0 && debouncedSearch ? (
        <EmptyState
          icon={SearchX}
          title="No projects found"
          description={`Nothing matches “${debouncedSearch}”.`}
          action={
            <Button variant="secondary" onClick={() => setSearch('')}>
              Clear search
            </Button>
          }
        />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title="Create your first project"
          description="Projects group related tasks so you can see progress at a glance."
          action={
            <Button onClick={() => setEditing({ open: true })}>
              <Plus className="h-4 w-4" /> New project
            </Button>
          }
        />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <li key={p.id}>
                <ProjectCard
                  project={p}
                  onEdit={(project) => setEditing({ open: true, project })}
                  onDelete={setDeleting}
                />
              </li>
            ))}
          </ul>
          {query.data && (
            <Pagination meta={query.data.meta} onPageChange={setPage} className="mt-6" label="projects" />
          )}
        </>
      )}

      <ProjectFormDialog
        open={editing.open}
        project={editing.project}
        onClose={() => setEditing({ open: false })}
      />
      <DeleteProjectDialog project={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense>
      <ProjectsPageContent />
    </Suspense>
  );
}
