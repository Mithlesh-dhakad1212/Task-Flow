/**
 * Due dates are calendar dates (Postgres DATE). Whether a task is overdue
 * therefore depends on what "today" is *for the user*, not for the server:
 * at 01:00 in Kolkata it is still yesterday in UTC.
 *
 * The frontend sends its IANA timezone in the `X-Timezone` header and we
 * resolve today's date in that zone, falling back to UTC.
 */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** The caller's timezone if it is a valid IANA name, otherwise UTC. */
export function resolveTimeZone(timeZone?: string): string {
  return timeZone && isValidTimeZone(timeZone) ? timeZone : 'UTC';
}

/** Returns today's calendar date in `timeZone` as a UTC-midnight Date (how Prisma represents DATE). */
export function todayInTimeZone(timeZone?: string, now: Date = new Date()): Date {
  const tz = resolveTimeZone(timeZone);
  // en-CA formats as YYYY-MM-DD
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return new Date(`${ymd}T00:00:00.000Z`);
}

/** Parses a YYYY-MM-DD string into a UTC-midnight Date. */
export function parseDateOnly(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

/** Formats a Date coming from a DATE column as YYYY-MM-DD. */
export function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** `date` shifted by `days` calendar days (UTC-midnight dates). */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
