'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="block h-10 w-full rounded-lg border-0 bg-white pl-9 pr-9 text-sm text-ink-900 shadow-sm ring-1 ring-inset ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-inset focus:ring-brand-500 focus-visible:ring-offset-0 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-ink-700"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
