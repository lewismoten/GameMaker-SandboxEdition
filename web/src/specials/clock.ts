// The Specials' "now": the real local time, unless a test date is set. SPECIALS DATE on the
// desk's PC (specialsExe.ts) keeps one in localStorage gm-specials-today, offline and in any
// build; on the dev server `?today=2026-11-26` (or `?today=2026-11-26T07:30`) in the address
// sets one for that page. A date alone means noon. No DOM beyond location and localStorage.
const KEY = 'gm-specials-today';

/** A test date written as YYYY-MM-DD or YYYY-MM-DDTHH:MM, read as local time; undefined when it isn't one. */
function parseToday(text: string | null | undefined): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2}))?$/.exec(text?.trim() ?? '');
  if (!m) return undefined;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d, m[4] ? Number(m[4]) : 12, m[5] ? Number(m[5]) : 0);
  return date.getMonth() === mo - 1 && date.getDate() === d ? date : undefined;
}

function fromAddress(): Date | undefined {
  if (!import.meta.env?.DEV || typeof location === 'undefined') return undefined;
  return parseToday(new URLSearchParams(location.search).get('today'));
}

/** The test date SPECIALS DATE set, as written, or undefined. */
export function testDate(): string | undefined {
  try {
    return localStorage.getItem(KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

/** Sets (or, with undefined, clears) the test date; false when `text` isn't a date. */
export function setTestDate(text: string | undefined): boolean {
  if (text !== undefined && !parseToday(text)) return false;
  try {
    if (text === undefined) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, text);
  } catch {
    /* private mode: nothing kept */
  }
  return true;
}

/** Now, for the Specials. */
export function specialsNow(): Date {
  return fromAddress() ?? parseToday(testDate()) ?? new Date();
}
