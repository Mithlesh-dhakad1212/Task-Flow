'use client';

import { AlertCircle, Columns3, List, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Select } from '@/components/ui/form-controls';
import { MultiSelect } from '@/components/ui/multi-select';
import { SearchInput } from '@/components/ui/search-input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useProjectOptions } from '@/hooks/use-projects';
import { SORT_OPTIONS, type SortKey, type TaskFilters as Filters } from '@/hooks/use-task-filters';
import { PRIORITIES, PRIORITY_META, STATUSES, STATUS_META } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function TaskFilters({
  filters,
  onChange,
  onClear,
  activeCount,
  showProjectFilter,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
  activeCount: number;
  showProjectFilter: boolean;
}) {
  const projects = useProjectOptions();

  // Typing updates instantly; the URL (and therefore the query) follows after a pause.
  const [search, setSearch] = useState(filters.search);
  const debounced = useDebouncedValue(search, 300);
  useEffect(() => {
    if (debounced.trim() !== filters.search) onChange({ search: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced text
  }, [debounced]);
  useEffect(() => {
    // Keep the box in sync when filters are cleared or changed via navigation.
    setSearch((s) => (s.trim() === filters.search ? s : filters.search));
  }, [filters.search]);

  return (
    <div className="mb-5 space-y-3 rounded-xl border border-ink-200/70 bg-white p-3 shadow-card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          label="Search tasks by title"
          placeholder="Search tasks…"
          className="flex-1"
        />
        <div className="flex items-center gap-2">
          <Select
            aria-label="Sort tasks"
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value as SortKey })}
            className="flex-1 sm:w-44 sm:flex-none"
          >
            {Object.entries(SORT_OPTIONS).map(([key, o]) => (
              <option key={key} value={key}>
                Sort: {o.label}
              </option>
            ))}
          </Select>
          <div className="flex rounded-lg bg-ink-100 p-1" role="group" aria-label="View">
            {(
              [
                ['board', Columns3, 'Board view'],
                ['list', List, 'List view'],
              ] as const
            ).map(([view, Icon, label]) => (
              <button
                key={view}
                type="button"
                aria-pressed={filters.view === view}
                aria-label={label}
                title={label}
                onClick={() => onChange({ view, page: filters.page })}
                className={cn(
                  'rounded-md p-1.5 transition',
                  filters.view === view ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800',
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        {showProjectFilter && (
          <Select
            aria-label="Filter by project"
            value={filters.projectId ?? ''}
            onChange={(e) => onChange({ projectId: e.target.value || undefined })}
            className={cn('col-span-2 sm:w-44', filters.projectId && 'font-medium text-brand-700 ring-brand-300')}
          >
            <option value="">All projects</option>
            {projects.data?.data.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        )}
        <MultiSelect
          label="Filter by status"
          allLabel="All statuses"
          value={filters.status}
          onChange={(status) => onChange({ status })}
          options={STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label, dot: STATUS_META[s].dot }))}
        />
        <MultiSelect
          label="Filter by priority"
          allLabel="All priorities"
          value={filters.priority}
          onChange={(priority) => onChange({ priority })}
          options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label }))}
        />
        <button
          type="button"
          aria-pressed={filters.overdue}
          onClick={() => onChange({ overdue: !filters.overdue })}
          className={cn(
            'flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm shadow-sm ring-1 ring-inset transition',
            filters.overdue
              ? 'bg-rose-50 font-medium text-rose-700 ring-rose-300'
              : 'bg-white text-ink-700 ring-ink-200 hover:bg-ink-50',
          )}
        >
          <AlertCircle className="h-4 w-4" aria-hidden />
          Overdue
        </button>
      </div>

      {activeCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-ink-500">
          <span>
            {activeCount} filter{activeCount > 1 ? 's' : ''} active
          </span>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              onClear();
            }}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-brand-600 hover:bg-brand-50"
          >
            <X className="h-3 w-3" aria-hidden /> Clear all
          </button>
        </div>
      )}
    </div>
  );
}
