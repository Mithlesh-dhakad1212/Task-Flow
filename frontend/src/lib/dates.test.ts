import { daysFromToday, formatDue, formatShortDate, todayISO } from './dates';

describe('date helpers', () => {
  // Local time, 15 Oct 2026 at 10:00
  const now = new Date(2026, 9, 15, 10, 0, 0);

  it('todayISO uses the local calendar date', () => {
    expect(todayISO(now)).toBe('2026-10-15');
    expect(todayISO(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('daysFromToday counts whole calendar days', () => {
    expect(daysFromToday('2026-10-15', now)).toBe(0);
    expect(daysFromToday('2026-10-16', now)).toBe(1);
    expect(daysFromToday('2026-10-10', now)).toBe(-5);
    // Across a month boundary / DST change
    expect(daysFromToday('2026-11-15', now)).toBe(31);
  });

  it.each([
    ['2026-10-15', 'Due today'],
    ['2026-10-16', 'Due tomorrow'],
    ['2026-10-14', '1 day overdue'],
    ['2026-10-12', '3 days overdue'],
    ['2026-10-30', 'Due Oct 30'],
  ])('formatDue(%s) → %s', (date, expected) => {
    expect(formatDue(date, now)).toBe(expected);
  });

  it('formatShortDate adds the year only when it differs', () => {
    expect(formatShortDate('2026-01-18', now)).toBe('Jan 18');
    expect(formatShortDate('2027-01-18', now)).toBe('Jan 18, 2027');
  });
});
