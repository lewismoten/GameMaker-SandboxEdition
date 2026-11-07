// What this browser remembers about the Specials (localStorage gm-specials, the backup's desk
// section): the ones kept for good, and how (opened or played in the Special tab, copied to My
// games, picked up on the desk, downloaded from a BBS, or subscribed to on the phone), and the
// DOS utility's test switches (lock: hidden whatever the date; unlock: shown whatever the date).
// A Special is listed while its window is open or once it is kept (`isListed`). Every change
// announces 'gm-specials-changed' so the catalog is loaded afresh (project/files.ts). No DOM.
import { isOpen } from './calendar';
import { specialById, type Special } from './registry';

const KEY = 'gm-specials';
export const SPECIALS_EVENT = 'gm-specials-changed';

export type KeptHow = 'opened' | 'played' | 'copied' | 'desk' | 'bbs' | 'watch' | 'window' | 'phone';

interface Saved {
  kept?: Record<string, { how: KeptHow; at: number }>;
  force?: Record<string, 'lock' | 'unlock'>;
}

function load(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}') as unknown;
    return v && typeof v === 'object' ? (v as Saved) : {};
  } catch {
    return {};
  }
}

function save(s: Saved): void {
  try {
    if (!Object.keys(s.kept ?? {}).length && !Object.keys(s.force ?? {}).length) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode: for this visit only */
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SPECIALS_EVENT));
}

/** How a Special was kept, or undefined while it is not. */
export const keptHow = (id: string): KeptHow | undefined => load().kept?.[id]?.how;

/** Keeps a Special for good (the first way it was kept is the one remembered). */
export function keepSpecial(id: string, how: KeptHow, now = Date.now()): void {
  const s = load();
  if (s.kept?.[id] || !specialById(id)) return;
  save({ ...s, kept: { ...s.kept, [id]: { how, at: now } } });
}

/** The DOS utility's switch for a Special, if one is set. */
export const forced = (id: string): 'lock' | 'unlock' | undefined => load().force?.[id];

/** LOCK or UNLOCK a Special for testing; undefined clears the switch. */
export function forceSpecial(id: string, to: 'lock' | 'unlock' | undefined): void {
  const s = load();
  const force = { ...s.force };
  if (to) force[id] = to;
  else delete force[id];
  save({ ...s, force });
}

/** RESET: forgets that a Special was kept and clears its switch, as if never seen. */
export function resetSpecial(id: string): void {
  const s = load();
  const kept = { ...s.kept };
  const force = { ...s.force };
  delete kept[id];
  delete force[id];
  save({ kept, force });
}

/** RESET ALL. */
export function resetAllSpecials(): void {
  save({});
}

/** Whether a Special's window is open at `now` (`extraDays` for a BBS that keeps it longer). */
export const inWindow = (s: Special, now: Date, extraDays = 0): boolean => isOpen(s.window, now, extraDays);

/** Whether a Special is listed (the Special tab, the catalog): unlocked, or kept, or in its window; never while locked. */
export function isListed(id: string, now: Date): boolean {
  const s = specialById(id);
  if (!s) return false;
  const f = forced(id);
  if (f) return f === 'unlock';
  return !!keptHow(id) || inWindow(s, now);
}
