// Which games hide a tin heart, and where: hearts.json, written by games/kit/tinHearts.ts from
// each game's about.json "tinHeart" field ({ "map": "port.map", "at": [10, 33] }: the map file
// and the cell the heart's block sits on in the built disk). The games that count are every
// Sandbox Software game and every Bard of Bizarre game (about.json "series": "bizarre"); a game
// whose about.json says "secret": true is left out altogether, heart or not. `pending` lists
// the games that count but have no heart declared yet (for EGG.EXE in development only).
// Plain data, no DOM: the generator, the tests and the web all read it from here.

export interface HeartPlace {
  /** The map file the heart's block is on (lower case, as on the disk). */
  map: string;
  /** Its cell on that map: column, row. */
  at: [number, number];
}

export interface HeartManifest {
  hearts: Record<string, HeartPlace>;
  pending: string[];
}

/** The about.json fields the manifest is made from. */
export interface AboutForHearts {
  company?: string;
  series?: string;
  secret?: boolean;
  tinHeart?: { map?: unknown; at?: unknown };
}

const SANDBOX = 'Sandbox Software';

/** Does a game count toward the tin hearts at all (a Sandbox or Bard of Bizarre game, not secret)? */
export const heartsCount = (a: AboutForHearts): boolean => a.secret !== true && ((a.company ?? SANDBOX) === SANDBOX || a.series === 'bizarre');

/** The about.json "tinHeart" field checked, or an error saying what is wrong with it. */
export function heartPlace(a: AboutForHearts): HeartPlace | string | undefined {
  const t = a.tinHeart;
  if (t === undefined) return undefined;
  if (!t || typeof t.map !== 'string' || !/^[a-z0-9_-]{1,8}\.map$/i.test(t.map)) return 'tinHeart.map must be the map file, like "port.map"';
  const at = t.at;
  if (!Array.isArray(at) || at.length !== 2 || !at.every((n) => Number.isInteger(n) && n >= 0) || at[0] >= 100 || at[1] >= 100)
    return 'tinHeart.at must be [column, row] on the 100x100 map';
  return { map: t.map.toLowerCase(), at: [at[0], at[1]] };
}

/** The manifest for a set of games (id -> about.json), ids in order. Throws on a bad entry. */
export function buildManifest(abouts: Record<string, AboutForHearts>): HeartManifest {
  const hearts: Record<string, HeartPlace> = {};
  const pending: string[] = [];
  for (const id of Object.keys(abouts).sort()) {
    const a = abouts[id];
    if (!heartsCount(a)) continue;
    const p = heartPlace(a);
    if (typeof p === 'string') throw new Error(`games/${id}/about.json: ${p}`);
    if (p) hearts[id] = p;
    else pending.push(id);
  }
  return { hearts, pending };
}

/** hearts.json as the generator writes it: one game a line. */
export function manifestText(m: HeartManifest): string {
  const ids = Object.keys(m.hearts);
  const lines = ids.map(
    (id, i) =>
      `    ${JSON.stringify(id)}: { "map": ${JSON.stringify(m.hearts[id].map)}, "at": [${m.hearts[id].at.join(', ')}] }${i < ids.length - 1 ? ',' : ''}`,
  );
  return `{\n  "hearts": {\n${lines.join('\n')}\n  },\n  "pending": [${m.pending.map((p) => JSON.stringify(p)).join(', ')}]\n}\n`;
}

/** Is a touch at cell (x, y) of map file `map` the heart at `place`? */
export const isHeartAt = (place: HeartPlace, map: string | undefined, x: number, y: number): boolean =>
  !!map && map.toLowerCase() === place.map && x === place.at[0] && y === place.at[1];
