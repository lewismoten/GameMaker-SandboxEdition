// The Specials' calendar: when a limited-time game is out. A window is a day rule (a fixed date,
// the nth weekday of a month, Easter, a weekday that falls on a date such as Friday the 13th,
// every such weekday, an ISO week, a whole month), moved by `offset` days, lasting `days` days,
// and optionally only between two hours of each of those days. Everything is worked out in the
// player's own time zone with local Date fields (so a daylight saving day is 23 or 25 hours
// long, as it is on the wall clock); nothing is fetched. No DOM.

/** 0 Sunday … 6 Saturday, as Date.getDay. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DayRule =
  /** The same date every year (month 1–12). */
  | { on: 'date'; month: number; day: number }
  /** The nth `weekday` of `month` (n 1–5; -1 the last), e.g. Thanksgiving is the 4th Thursday of November. */
  | { on: 'nth'; month: number; weekday: Weekday; n: number }
  /** Western (Gregorian) Easter Sunday; Good Friday is offset -2. */
  | { on: 'easter' }
  /** Every month whose `day` falls on `weekday` (Friday the 13th). */
  | { on: 'weekday-date'; weekday: Weekday; day: number }
  /** Every `weekday`, all year. */
  | { on: 'weekday'; weekday: Weekday }
  /** Monday of ISO week `week` (1–53; a year with 52 weeks has no 53rd). */
  | { on: 'week'; week: number }
  /** The first of `month`; its window lasts the whole month unless `days` says otherwise. */
  | { on: 'month'; month: number };

export interface Window {
  day: DayRule;
  /** Days from the rule's day to the window's first day (-1: the day before). */
  offset?: number;
  /** How many days it lasts (default 1; a week rule 7; a month rule the month). */
  days?: number;
  /** Only from this hour (0–23) of each day… */
  from?: number;
  /** …until this hour (1–24; less than `from` runs past midnight). */
  to?: number;
}

/** A stretch of local time: from `start` up to, not including, `end`. */
export interface Span {
  start: Date;
  end: Date;
}

const local = (y: number, m: number, d: number, h = 0) => new Date(y, m - 1, d, h);

const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

/** Easter Sunday of `year` (the anonymous Gregorian algorithm), as [month, day]. */
export function easter(year: number): [number, number] {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  return [month, ((h + l - 7 * m + 114) % 31) + 1];
}

/** The day of the nth `weekday` of a month (n -1: the last), or undefined (no 5th one). */
export function nthWeekday(year: number, month: number, weekday: Weekday, n: number): number | undefined {
  if (n < 0) {
    const last = daysInMonth(year, month);
    return last - ((local(year, month, last).getDay() - weekday + 7) % 7);
  }
  const first = 1 + ((weekday - local(year, month, 1).getDay() + 7) % 7);
  const day = first + (n - 1) * 7;
  return day <= daysInMonth(year, month) ? day : undefined;
}

/** How many ISO weeks `year` has (53 when it starts on a Thursday, or a Wednesday in a leap year). */
function isoWeeks(year: number): number {
  const jan1 = local(year, 1, 1).getDay();
  const leap = daysInMonth(year, 2) === 29;
  return jan1 === 4 || (leap && jan1 === 3) ? 53 : 52;
}

/** The rule's days in `year`, each as [year, month, day] (a Monday of an ISO week may be in late December before). */
export function ruleDays(rule: DayRule, year: number): [number, number, number][] {
  switch (rule.on) {
    case 'date':
      return rule.day <= daysInMonth(year, rule.month) ? [[year, rule.month, rule.day]] : [];
    case 'nth': {
      const d = nthWeekday(year, rule.month, rule.weekday, rule.n);
      return d ? [[year, rule.month, d]] : [];
    }
    case 'easter':
      return [[year, ...easter(year)]];
    case 'weekday-date': {
      const out: [number, number, number][] = [];
      for (let m = 1; m <= 12; m++) if (rule.day <= daysInMonth(year, m) && local(year, m, rule.day).getDay() === rule.weekday) out.push([year, m, rule.day]);
      return out;
    }
    case 'weekday': {
      const out: [number, number, number][] = [];
      for (let d = local(year, 1, 1); d.getFullYear() === year; d.setDate(d.getDate() + 1))
        if (d.getDay() === rule.weekday) out.push([year, d.getMonth() + 1, d.getDate()]);
      return out;
    }
    case 'week': {
      if (rule.week < 1 || rule.week > isoWeeks(year)) return [];
      const jan4 = local(year, 1, 4);
      const monday = local(year, 1, 4 - ((jan4.getDay() + 6) % 7) + (rule.week - 1) * 7);
      return [[monday.getFullYear(), monday.getMonth() + 1, monday.getDate()]];
    }
    case 'month':
      return [[year, rule.month, 1]];
  }
}

const defaultDays = (rule: DayRule, y: number, m: number): number => (rule.on === 'week' ? 7 : rule.on === 'month' ? daysInMonth(y, m) : 1);

/** Each whole-day stretch of the window that starts in `year` (hours aside), in order. */
export function spansIn(win: Window, year: number): Span[] {
  return ruleDays(win.day, year).map(([y, m, d]) => {
    const start = local(y, m, d + (win.offset ?? 0));
    const end = local(y, m, d + (win.offset ?? 0) + (win.days ?? defaultDays(win.day, y, m)));
    return { start, end };
  });
}

/** Whether `now`'s hour is inside the window's daily hours (always, with none). */
function inHours(win: Window, now: Date): boolean {
  if (win.from === undefined && win.to === undefined) return true;
  const h = now.getHours();
  const from = win.from ?? 0;
  const to = win.to ?? 24;
  return from <= to ? h >= from && h < to : h >= from || h < to;
}

/** The window's stretch holding `now` (ignoring daily hours), or undefined. `extra` days are added to its end (a BBS that keeps a file a little longer). */
function spanAround(win: Window, now: Date, extra = 0): Span | undefined {
  const y = now.getFullYear();
  for (const year of [y - 1, y, y + 1])
    for (const s of spansIn(win, year)) {
      const end = extra ? local(s.end.getFullYear(), s.end.getMonth() + 1, s.end.getDate() + extra) : s.end;
      if (now >= s.start && now < end) return { start: s.start, end };
    }
  return undefined;
}

/** Whether the window is open at `now` (in its days and, if it has them, its hours). */
export function isOpen(win: Window, now: Date, extraDays = 0): boolean {
  return !!spanAround(win, now, extraDays) && (extraDays > 0 ? true : inHours(win, now));
}

/** The stretch of days open at `now`, or undefined. */
export const openSpan = (win: Window, now: Date, extraDays = 0): Span | undefined =>
  isOpen(win, now, extraDays) ? spanAround(win, now, extraDays) : undefined;

/** The first day the window opens after `now` (its first whole-day stretch starting later), or undefined within two years. */
export function nextOpening(win: Window, now: Date): Date | undefined {
  const y = now.getFullYear();
  const starts = [y, y + 1, y + 2].flatMap((year) => spansIn(win, year).map((s) => s.start)).filter((d) => d > now);
  starts.sort((a, b) => a.getTime() - b.getTime());
  const first = starts[0];
  if (!first || win.from === undefined) return first;
  return new Date(first.getFullYear(), first.getMonth(), first.getDate(), win.from);
}
