// The Specials: limited-time games from Sandbox Software (../games/<id>/about.json "series":
// "special"; their windows in specials/registry.ts). One is in the catalog only while it is
// listed (its window is open, or this browser kept it: specials/state.ts isListed), and then
// only in the home page's Special tab and, once it reaches the desk, the disk box. They are not
// Sandbox games (no box, manual or goodies) and not shareware. Small on purpose: files.ts imports it.
import { isListed } from '../specials/state';
import { specialsNow } from '../specials/clock';

interface Listed {
  id?: string;
  original?: unknown;
  series?: string;
}

/** One of the Specials: an original game marked "series": "special". */
export const isSpecialGame = (g: Listed): boolean => !!g.original && g.series === 'special';

/** Every Special's entry the catalog last held, listed or not: a BBS keeps a file a few days after the Special tab lets it go (specialEntry). */
const seen = new Map<string, unknown>();

/** The catalog without the Specials that are not listed at `now`. */
export function withSpecials<T extends Listed>(list: T[], now = specialsNow()): T[] {
  for (const g of list) if (isSpecialGame(g) && g.id) seen.set(g.id, g);
  return list.filter((g) => !isSpecialGame(g) || (!!g.id && isListed(g.id, now)));
}

/** A Special's catalog entry, listed or not, once a catalog has been loaded this visit. */
export const specialEntry = <T>(id: string): T | undefined => seen.get(id) as T | undefined;
