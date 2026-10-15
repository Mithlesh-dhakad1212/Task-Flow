'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Option<T extends string> {
  value: T;
  label: string;
  dot?: string;
}

/** Compact filter dropdown with checkbox options ("All statuses ▾"). */
export function MultiSelect<T extends string>({
  label,
  allLabel,
  options,
  value,
  onChange,
}: {
  label: string;
  allLabel: string;
  options: Option<T>[];
  value: T[];
  onChange: (value: T[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const summary =
    value.length === 0
      ? allLabel
      : value.length === 1
        ? options.find((o) => o.value === value[0])?.label
        : `${value.length} selected`;

  const toggle = (v: T) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-lg bg-white px-3 text-sm shadow-sm ring-1 ring-inset transition sm:w-auto sm:min-w-36',
          value.length ? 'font-medium text-brand-700 ring-brand-300' : 'text-ink-700 ring-ink-200 hover:bg-ink-50',
        )}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          className="absolute left-0 z-20 mt-1 w-48 animate-fade-in rounded-lg border border-ink-200 bg-white py-1 shadow-lift"
        >
          {options.map((o) => {
            const selected = value.includes(o.value);
            return (
              <li key={o.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => toggle(o.value)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border',
                      selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300',
                    )}
                  >
                    {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  {o.dot && <span className={cn('h-2 w-2 rounded-full', o.dot)} aria-hidden />}
                  {o.label}
                </button>
              </li>
            );
          })}
          {value.length > 0 && (
            <li className="mt-1 border-t border-ink-100 pt-1">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full px-3 py-1.5 text-left text-xs font-medium text-ink-500 hover:text-ink-800"
              >
                Clear
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
