// The day of a visitor's last visit to the tour's "What's new", kept in this browser only
// (localStorage `gm-tour-seen`, never sent anywhere). Small and free of the tour's data, so the
// header's ? button can use it without loading the chapters. The first visit sets the day to
// today and offers nothing, since the whole tour is already offered then.

export const SEEN_KEY = 'gm-tour-seen';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Is this a real calendar day written YYYY-MM-DD? */
export function isDay(s: string | undefined): s is string {
  if (!s || !DAY.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** The day of the last visit, or null (none yet, damaged, or no storage). */
export function readSeen(): string | null {
  try {
    const v = localStorage.getItem(SEEN_KEY);
    return isDay(v ?? undefined) ? v : null;
  } catch {
    return null;
  }
}

/** Records `day` (default: today) as the last visit; false when storage is not there. */
export function writeSeen(day: string = new Date().toISOString().slice(0, 10)): boolean {
  try {
    localStorage.setItem(SEEN_KEY, day);
    return true;
  } catch {
    return false;
  }
}

/** The first visit: remembers today and offers nothing. Later visits keep their date. Returns the date from before. */
export function seenOnFirstVisit(): string | null {
  const before = readSeen();
  if (before === null) writeSeen();
  return before;
}
