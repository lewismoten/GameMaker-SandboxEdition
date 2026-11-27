// The published tour watermark stays small so the header can record it before loading chapters.
export const SEEN_KEY = 'gm-tour-seen';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Is this a real calendar day written YYYY-MM-DD? */
export function isDay(s: string | undefined): s is string {
  if (!s || !DAY.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// IDs published on the latest tour update day. The chapter-data test keeps this in sync.
const published = '2026-11-05|home-import-history,home-recently-deleted,home-tab-starters,home-how-do-i,edit-around-groups,edit-around-card-used';

export function parseSeen(value: string | null) {
  const [day, ids, extra] = value?.split('|') ?? [];
  if (!isDay(day) || extra !== undefined || (ids !== undefined && !/^[a-z0-9-]+(?:,[a-z0-9-]+)*$/.test(ids))) return null;
  return { day, ids: new Set(ids?.split(',')) };
}

/** The day of the last visit, or null (none yet, damaged, or no storage). */
export function readSeen(): string | null {
  try {
    const v = localStorage.getItem(SEEN_KEY);
    return parseSeen(v) ? v : null;
  } catch {
    return null;
  }
}

/** Records the published watermark or an explicit day; false when storage is not there. */
export function writeSeen(day: string = published): boolean {
  try {
    localStorage.setItem(SEEN_KEY, day);
    return true;
  } catch {
    return false;
  }
}

/** The first visit: remembers this build and offers nothing. Later visits keep their date. Returns the date from before. */
export function seenOnFirstVisit(): string | null {
  const before = readSeen();
  if (before === null) writeSeen();
  return before;
}
