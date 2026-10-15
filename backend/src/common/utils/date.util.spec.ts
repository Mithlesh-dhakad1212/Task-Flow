import { formatDateOnly, isValidTimeZone, parseDateOnly, todayInTimeZone } from './date.util';

describe('date utils', () => {
  // 2026-10-15 20:30 UTC = 2026-10-16 02:00 in Kolkata (UTC+5:30)
  const instant = new Date('2026-10-15T20:30:00.000Z');

  it('resolves "today" in the caller timezone, not the server one', () => {
    expect(formatDateOnly(todayInTimeZone('UTC', instant))).toBe('2026-10-15');
    expect(formatDateOnly(todayInTimeZone('Asia/Kolkata', instant))).toBe('2026-10-16');
    expect(formatDateOnly(todayInTimeZone('America/Los_Angeles', instant))).toBe('2026-10-15');
  });

  it('falls back to UTC for missing or invalid timezones', () => {
    expect(formatDateOnly(todayInTimeZone(undefined, instant))).toBe('2026-10-15');
    expect(formatDateOnly(todayInTimeZone('Mars/Olympus_Mons', instant))).toBe('2026-10-15');
  });

  it('returns UTC midnight so it compares correctly with DATE columns', () => {
    expect(todayInTimeZone('Asia/Kolkata', instant).toISOString()).toBe('2026-10-16T00:00:00.000Z');
  });

  it('validates IANA timezone names', () => {
    expect(isValidTimeZone('Europe/London')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
  });

  it('round-trips date-only strings', () => {
    expect(formatDateOnly(parseDateOnly('2026-02-28'))).toBe('2026-02-28');
  });
});
