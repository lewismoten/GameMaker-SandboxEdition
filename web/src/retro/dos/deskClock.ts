// The 1994 room's one clock: the real time plus an offset that DOS's TIME and DATE set (kept
// between visits), so Lewis can make it night to see the black light, the moon and THE
// CHEZ, or 3:17 a.m. on the wall clock. Everything time-based in the room reads deskNow():
// the wristwatch, the window's day and night and its moon, the drive-by, the black light,
// the prompt's TIME and DATE and the dates of files the PC makes. TIME RESET (or /LOCAL,
// or DATE RESET) goes back to the real local time. A change is announced ('gm-desk-clock') so the
// room follows at once.
const KEY = 'gm-desk-clock';
const DESK_CLOCK_EVENT = 'gm-desk-clock';

function load(): number {
  try {
    const v = Number(localStorage.getItem(KEY));
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

let offset = load();

/** Whether TIME or DATE has set the room to another time than the real one. */
export const deskClockSet = (): boolean => offset !== 0;

/** Now, by the room's clock. */
export function deskNow(): Date {
  return new Date(Date.now() + offset);
}
export const deskMs = (): number => Date.now() + offset;

function save(ms: number): void {
  offset = ms;
  try {
    if (ms) localStorage.setItem(KEY, String(ms));
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: for this visit only */
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(DESK_CLOCK_EVENT));
}

/** Sets the room's clock to `to` (it runs on from there). */
export function setDeskClock(to: Date): void {
  save(Math.round(to.getTime() - Date.now()));
}

/** Back to the real local time. */
export function resetDeskClock(): void {
  save(0);
}

/** Calls `f` whenever TIME or DATE changes the room's clock. */
export function onDeskClock(f: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(DESK_CLOCK_EVENT, f);
  return () => window.removeEventListener(DESK_CLOCK_EVENT, f);
}

// ---- DOS 6.22's TIME and DATE ---------------------------------------------------------------

/** "9:41:07.12p", as TIME prints it (the hour padded to two places). */
export function dosTime(d: Date): string {
  const h = d.getHours();
  const h12 = h % 12 || 12;
  const two = (n: number) => String(n).padStart(2, '0');
  return `${String(h12).padStart(2)}:${two(d.getMinutes())}:${two(d.getSeconds())}.${two(Math.floor(d.getMilliseconds() / 10))}${h < 12 ? 'a' : 'p'}`;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** "Fri 10-23-1994", as DATE prints it. */
export function dosDate(d: Date): string {
  const two = (n: number) => String(n).padStart(2, '0');
  return `${DAYS[d.getDay()]} ${two(d.getMonth() + 1)}-${two(d.getDate())}-${d.getFullYear()}`;
}

/**
 * A time typed at TIME: hours[:minutes[:seconds[.hundredths]]] with an optional a or p
 * (11:30p, 9a, 23:30, 7.05.00), on `base`'s day. Undefined when DOS would say "Invalid time".
 */
export function parseDosTime(text: string, base: Date): Date | undefined {
  const m = /^(\d{1,2})(?:[:.](\d{1,2})(?:[:.](\d{1,2})(?:[.,](\d{1,2}))?)?)?\s*([ap])?m?$/i.exec(text.trim());
  if (!m) return undefined;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const s = Number(m[3] ?? 0);
  const cs = Number((m[4] ?? '0').padEnd(2, '0'));
  const ap = m[5]?.toLowerCase();
  if (ap) {
    if (h < 1 || h > 12) return undefined;
    h = (h % 12) + (ap === 'p' ? 12 : 0);
  }
  if (h > 23 || min > 59 || s > 59) return undefined;
  const d = new Date(base);
  d.setHours(h, min, s, cs * 10);
  return d;
}

/**
 * A date typed at DATE: month-day-year with -, / or . between (10-23-94, 12/25/1994), at
 * `base`'s time of day. Two-digit years 80-99 are 19xx, 00-79 20xx; DOS takes 1980-2099.
 * Undefined when DOS would say "Invalid date".
 */
export function parseDosDate(text: string, base: Date): Date | undefined {
  const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/.exec(text.trim());
  if (!m) return undefined;
  const mo = Number(m[1]);
  const day = Number(m[2]);
  let y = Number(m[3]);
  if (m[3].length === 2) y += y >= 80 ? 1900 : 2000;
  if (y < 1980 || y > 2099 || mo < 1 || mo > 12 || day < 1) return undefined;
  const d = new Date(base);
  d.setFullYear(y, mo - 1, day);
  if (d.getMonth() !== mo - 1) return undefined; // 2-30, 4-31
  return d;
}
