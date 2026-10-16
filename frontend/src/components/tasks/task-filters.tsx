'use client';

import { AlertCircle, Layers, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Select } from '@/components/ui/form-controls';
import { MultiSelect } from '@/components/ui/multi-select';
import { SearchInput } from '@/components/ui/search-input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useProjectOptions } from '@/hooks/use-projects';
import { SORT_OPTIONS, type SortKey, type TaskFilters as Filters } from '@/hooks/use-task-filters';
import { PRIORITIES, PRIORITY_META, STATUSES, STATUS_META } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { type GroupBy } from './board-columns';

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

  const groupOptions: { value: GroupBy; label: string }[] = [
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' },
    ...(showProjectFilter ? [{ value: 'project' as const, label: 'Project' }] : []),
  ];

  return (
    <div className="mb-4 space-y-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          label="Search tasks by title"
          placeholder="Search tasks…  ( / )"
          className="sm:max-w-md sm:flex-1"
        />
        <div className="grid grid-cols-2 gap-2 sm:ml-auto sm:flex">
          {filters.view === 'board' && (
            <label className="relative flex items-center">
              <Layers className="pointer-events-none absolute left-3 h-4 w-4 text-ink-400" aria-hidden />
              <span className="sr-only">Group board by</span>
              <Select
                value={filters.group}
                onChange={(e) => onChange({ group: e.target.value as GroupBy })}
                className="pl-9 sm:w-48"
              >
                {groupOptions.map((g) => (
                  <option key={g.value} value={g.value}>
                    Group: {g.label}
                  </option>
                ))}
              </Select>
            </label>
          )}
          <Select
            aria-label="Sort tasks"
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value as SortKey })}
            className="sm:w-44"
          >
            {Object.entries(SORT_OPTIONS).map(([key, o]) => (
              <option key={key} value={key}>
                Sort: {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        {showProjectFilter && (
          <Select
            aria-label="Filter by project"
            value={filters.projectId ?? ''}
            onChange={(e) => onChange({ projectId: e.target.value || undefined })}
            className={cn('col-span-2 sm:w-44', filters.projectId && 'font-medium text-brand-700 ring-brand-500/50 dark:text-brand-300')}
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
          options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label, dot: PRIORITY_META[p].bar }))}
        />
        <button
          type="button"
          aria-pressed={filters.overdue}
          onClick={() => onChange({ overdue: !filters.overdue })}
          className={cn(
            'flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm shadow-sm ring-1 ring-inset transition',
            filters.overdue
              ? 'bg-rose-500/10 font-medium text-rose-700 ring-rose-500/50 dark:text-rose-300'
              : 'bg-surface text-ink-700 ring-ink-200 hover:bg-ink-50',
          )}
        >
          <AlertCircle className="h-4 w-4" aria-hidden />
          Overdue
        </button>
        {activeCount > 0 && (
          <div className="col-span-2 flex items-center gap-2 text-xs text-ink-500 sm:ml-1">
            <span>
              {activeCount} filter{activeCount > 1 ? 's' : ''} active
            </span>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                onClear();
              }}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-brand-600 hover:bg-brand-500/10"
            >
              <X className="h-3 w-3" aria-hidden /> Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
