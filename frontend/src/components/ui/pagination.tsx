import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type PageMeta } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from './button';

export function Pagination({
  meta,
  onPageChange,
  className,
  label = 'items',
}: {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  className?: string;
  label?: string;
}) {
  if (meta.totalPages <= 1) return null;
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <nav className={cn('flex items-center justify-between gap-3 text-sm', className)} aria-label="Pagination">
      <p className="text-ink-500">
        {from}–{to} of {meta.total} {label}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={meta.page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <span className="text-xs text-ink-500">
          {meta.page} / {meta.totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={meta.page >= meta.totalPages}
          aria-label="Next page"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
