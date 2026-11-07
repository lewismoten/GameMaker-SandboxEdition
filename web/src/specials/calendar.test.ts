// The Specials' calendar: fixed dates, movable feasts, nth weekdays, year boundaries, daily hours and a daylight saving day.
// Dates are local (new Date(y, m - 1, d, h)), so these hold in any time zone; the DST test runs in New York's.
import { describe, expect, it } from 'vitest';
import { easter, isOpen, nextOpening, nthWeekday, openSpan, ruleDays, spansIn, type Window } from './calendar';

const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min);
const ymd = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];

describe('day rules', () => {
  it('finds Easter (Gregorian) in known years', () => {
    expect(easter(2024)).toEqual([3, 31]);
    expect(easter(2025)).toEqual([4, 20]);
    expect(easter(2026)).toEqual([4, 5]);
    expect(easter(2027)).toEqual([3, 28]);
    expect(easter(2038)).toEqual([4, 25]); // the latest possible
    expect(easter(2285)).toEqual([3, 22]); // the earliest possible
  });

  it('finds the nth and last weekday of a month', () => {
    expect(nthWeekday(2026, 11, 4, 4)).toBe(26); // Thanksgiving
    expect(nthWeekday(2027, 11, 4, 4)).toBe(25);
    expect(nthWeekday(2026, 9, 1, 1)).toBe(7); // Labor Day
    expect(nthWeekday(2026, 5, 1, -1)).toBe(25); // Memorial Day, the last Monday
    expect(nthWeekday(2026, 1, 1, 3)).toBe(19); // Martin Luther King Jr. Day
    expect(nthWeekday(2026, 2, 0, 5)).toBeUndefined(); // February 2026 has four Sundays
  });

  it('lists the Fridays the 13th of a year', () => {
    expect(ruleDays({ on: 'weekday-date', weekday: 5, day: 13 }, 2026)).toEqual([
      [2026, 2, 13],
      [2026, 3, 13],
      [2026, 11, 13],
    ]);
  });

  it('skips a date a year does not have, and a 53rd week a year does not have', () => {
    expect(ruleDays({ on: 'date', month: 2, day: 29 }, 2026)).toEqual([]);
    expect(ruleDays({ on: 'date', month: 2, day: 29 }, 2028)).toEqual([[2028, 2, 29]]);
    expect(ruleDays({ on: 'week', week: 53 }, 2026)).toEqual([[2026, 12, 28]]); // 2026 starts on a Thursday
    expect(ruleDays({ on: 'week', week: 53 }, 2027)).toEqual([]);
  });

  it('puts ISO week 1 on the Monday of the week holding January 4th', () => {
    expect(ruleDays({ on: 'week', week: 1 }, 2026)).toEqual([[2025, 12, 29]]);
    expect(ruleDays({ on: 'week', week: 46 }, 2026)).toEqual([[2026, 11, 9]]);
  });

  it('counts every Saturday of a year', () => {
    expect(ruleDays({ on: 'weekday', weekday: 6 }, 2026)).toHaveLength(52);
  });
});

describe('windows', () => {
  const veterans: Window = { day: { on: 'date', month: 11, day: 11 }, offset: -1, days: 3 };
  const thanksgiving: Window = { day: { on: 'nth', month: 11, weekday: 4, n: 4 }, days: 4 };

  it('opens a fixed-date window with days on each side, at midnight local time', () => {
    expect(isOpen(veterans, at(2026, 11, 9, 23, 59))).toBe(false);
    expect(isOpen(veterans, at(2026, 11, 10, 0, 0))).toBe(true);
    expect(isOpen(veterans, at(2026, 11, 12, 23, 59))).toBe(true);
    expect(isOpen(veterans, at(2026, 11, 13, 0, 0))).toBe(false);
  });

  it('opens Thanksgiving through the Sunday after', () => {
    const s = openSpan(thanksgiving, at(2026, 11, 28))!;
    expect(ymd(s.start)).toEqual([2026, 11, 26]);
    expect(ymd(s.end)).toEqual([2026, 11, 30]);
    expect(isOpen(thanksgiving, at(2026, 11, 25))).toBe(false);
  });

  it('runs a window across the new year', () => {
    const nye: Window = { day: { on: 'date', month: 12, day: 31 }, days: 2 };
    expect(isOpen(nye, at(2026, 12, 31))).toBe(true);
    expect(isOpen(nye, at(2027, 1, 1, 23))).toBe(true); // the window that started last year
    expect(isOpen(nye, at(2027, 1, 2))).toBe(false);
    const week1: Window = { day: { on: 'week', week: 1 } };
    expect(isOpen(week1, at(2025, 12, 30))).toBe(true); // 2026's week 1 starts in 2025
  });

  it('keeps to its hours, overnight ones too', () => {
    const breakfast: Window = { day: { on: 'weekday', weekday: 6 }, from: 6, to: 9 };
    expect(isOpen(breakfast, at(2026, 11, 7, 5, 59))).toBe(false);
    expect(isOpen(breakfast, at(2026, 11, 7, 6, 0))).toBe(true);
    expect(isOpen(breakfast, at(2026, 11, 7, 9, 0))).toBe(false);
    expect(isOpen(breakfast, at(2026, 11, 8, 7, 0))).toBe(false); // a Sunday
    const late: Window = { day: { on: 'month', month: 10 }, from: 22, to: 2 };
    expect(isOpen(late, at(2026, 10, 15, 23))).toBe(true);
    expect(isOpen(late, at(2026, 10, 15, 1))).toBe(true);
    expect(isOpen(late, at(2026, 10, 15, 12))).toBe(false);
  });

  it('lingers extra days (a BBS file) and ignores the hours then', () => {
    const fri13: Window = { day: { on: 'weekday-date', weekday: 5, day: 13 } };
    expect(isOpen(fri13, at(2026, 11, 15))).toBe(false);
    expect(isOpen(fri13, at(2026, 11, 15), 3)).toBe(true);
    expect(isOpen(fri13, at(2026, 11, 16, 23, 59), 3)).toBe(true);
    expect(isOpen(fri13, at(2026, 11, 17, 0, 0), 3)).toBe(false);
  });

  it('a month window lasts the month', () => {
    const feb: Window = { day: { on: 'month', month: 2 } };
    expect(spansIn(feb, 2028).map((s) => ymd(s.end))).toEqual([[2028, 3, 1]]);
  });

  it('says when it opens next', () => {
    expect(ymd(nextOpening(thanksgiving, at(2026, 11, 7))!)).toEqual([2026, 11, 26]);
    expect(ymd(nextOpening(thanksgiving, at(2026, 11, 27))!)).toEqual([2027, 11, 25]);
    const morning: Window = { day: { on: 'date', month: 1, day: 1 }, from: 8, to: 10 };
    expect(nextOpening(morning, at(2026, 11, 7))!.getHours()).toBe(8);
  });
});

describe('daylight saving (America/New_York)', () => {
  it('a window on the day the clocks fall back is 25 hours, and still opens at local midnight', async () => {
    const old = process.env.TZ;
    process.env.TZ = 'America/New_York';
    try {
      const { spansIn: spans } = await import('./calendar');
      const [s] = spans({ day: { on: 'date', month: 11, day: 1 } }, 2026); // 2026-11-01 02:00 back to 01:00
      expect(s.start.getTimezoneOffset()).not.toBe(s.end.getTimezoneOffset());
      expect((s.end.getTime() - s.start.getTime()) / 3_600_000).toBe(25);
      expect(s.start.getHours()).toBe(0);
      const [spring] = spans({ day: { on: 'date', month: 3, day: 8 } }, 2026);
      expect((spring.end.getTime() - spring.start.getTime()) / 3_600_000).toBe(23);
    } finally {
      if (old === undefined) delete process.env.TZ;
      else process.env.TZ = old;
    }
  });
});
