'use client';

import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface MenuItem {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
}

/** Small "⋯" actions menu. Closes on outside click, Escape and selection. */
export function ActionsMenu({ items, label = 'Actions' }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="rounded-md p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-40 animate-fade-in overflow-hidden rounded-lg border border-ink-200 bg-white py-1 shadow-lift"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition',
                item.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-ink-700 hover:bg-ink-50',
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
