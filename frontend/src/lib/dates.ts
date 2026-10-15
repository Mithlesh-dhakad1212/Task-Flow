/** Today's calendar date in the browser's timezone, as YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole days from today to `dateOnly` (negative = in the past). */
export function daysFromToday(dateOnly: string, now: Date = new Date()): number {
  const target = Date.UTC(+dateOnly.slice(0, 4), +dateOnly.slice(5, 7) - 1, +dateOnly.slice(8, 10));
  const today = todayISO(now);
  const base = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
  return Math.round((target - base) / 86_400_000);
}

/** "Due today", "Due tomorrow", "3 days overdue", "Due Jan 18". */
export function formatDue(dateOnly: string, now: Date = new Date()): string {
  const diff = daysFromToday(dateOnly, now);
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff === -1) return '1 day overdue';
  if (diff < 0) return `${-diff} days overdue`;
  return `Due ${formatShortDate(dateOnly, now)}`;
}

/** "Jan 18" (adds the year when it differs from the current one). */
export function formatShortDate(dateOnly: string, now: Date = new Date()): string {
  const [y, m, d] = dateOnly.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
    ...(y !== now.getFullYear() && { year: 'numeric' }),
  });
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((now.getTime() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
