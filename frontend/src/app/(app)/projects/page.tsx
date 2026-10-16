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
import { useUI } from '@/context/ui-context';
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
  const ui = useUI();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('updated');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim());

  // `/projects?new=1` opens the create dialog (deep link used by empty states).
  useEffect(() => {
    if (params.get('new') === '1') {
      ui.openCreateProject();
      router.replace('/projects', { scroll: false });
    }
  }, [params, router, ui]);

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
        description="Every project with its task counts and completion progress."
        actions={
          <Button onClick={ui.openCreateProject}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} label="Search projects" placeholder="Search projects…" className="sm:w-80" />
        <div className="flex items-center gap-3">
          {query.data && (
            <span className="hidden text-sm text-ink-500 sm:inline">
              {query.data.meta.total} project{query.data.meta.total === 1 ? '' : 's'}
            </span>
          )}
          <Select aria-label="Sort projects" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="sm:w-56">
            {Object.entries(SORTS).map(([key, s]) => (
              <option key={key} value={key}>
                Sort: {s.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {query.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading projects">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
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
            <Button onClick={ui.openCreateProject}>
              <Plus className="h-4 w-4" /> New project
            </Button>
          }
        />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <li key={p.id}>
                <ProjectCard project={p} onEdit={setEditing} onDelete={setDeleting} />
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={ui.openCreateProject}
                className="flex h-full min-h-56 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 text-sm font-medium text-ink-500 transition hover:border-brand-500/50 hover:bg-brand-500/5 hover:text-brand-600"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100">
                  <Plus className="h-5 w-5" aria-hidden />
                </span>
                New project
              </button>
            </li>
          </ul>
          {query.data && <Pagination meta={query.data.meta} onPageChange={setPage} className="mt-6" label="projects" />}
        </>
      )}

      <ProjectFormDialog open={!!editing} project={editing} onClose={() => setEditing(null)} />
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
