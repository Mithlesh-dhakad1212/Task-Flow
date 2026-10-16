import { FolderKanban } from 'lucide-react';
import { PROJECT_COLORS } from '@/lib/constants';
import { type ProjectColor } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ProjectIcon({ color, size = 'md' }: { color: ProjectColor; size?: 'sm' | 'md' | 'lg' }) {
  const c = PROJECT_COLORS[color] ?? PROJECT_COLORS.blue;
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm',
        c.gradient,
        { sm: 'h-7 w-7', md: 'h-9 w-9', lg: 'h-12 w-12 rounded-xl' }[size],
      )}
      aria-hidden
    >
      <FolderKanban className={size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'} />
    </span>
  );
}
