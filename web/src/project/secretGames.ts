// Secret games: an original game (games/<id>) whose about.json says "secret": true stays out
// of every listing that goes through loadCatalog / loadCatalogList (the desk shelf, the home
// page, the retro PC's drives, the catalog printables, the play page) until what reveals it is
// found: every felt egg (eggs/eggState.ts: held in a game's save, or added with EGG.EXE), or,
// for one whose about.json also says "unlock": "hearts", every tin heart (tinHearts/tinHearts.ts).
//
// Nothing the site serves up front names them: the build (web/scripts/cdGames.ts) leaves
// them out of games/index.json, games/catalog.json, the pages, sitemap and pictures, and
// writes them to games/extra.json alone, which is fetched only once something is revealed.
// No id is written here either: SECRETS knows each by its idHash.

/** What reveals a secret game. */
type Gate = 'eggs' | 'hearts';

/** Which gates are open: a bit each (1 the felt eggs, 2 the tin hearts). */
const GATE_BIT: Record<Gate, number> = { eggs: 1, hearts: 2 };

/** True once every egg counts as found. Never throws (no IndexedDB, no eggs: still hidden). */
async function eggsFound(): Promise<boolean> {
  try {
    // A dynamic import: eggState reads saves through project/storage, which imports files.ts.
    const { eggStates } = await import('../eggs/eggState');
    const states = await eggStates();
    return states.length > 0 && states.every((s) => s.found);
  } catch {
    return false;
  }
}

/**
 * True once every tin heart counts as found. The hearts are counted from the manifest's games,
 * not the catalog's: loading the catalog comes back here (withSecretGames). Never throws.
 */
async function heartsFound(): Promise<boolean> {
  try {
    const { MANIFEST, heartStates } = await import('../tinHearts/tinHearts');
    const states = await heartStates(Object.keys(MANIFEST.hearts).map((id) => ({ id, title: id })));
    return states.length > 0 && states.every((s) => s.found);
  } catch {
    return false;
  }
}

/** Which gates are open now (GATE_BIT), 0 when nothing is revealed. */
export async function secretsRevealed(): Promise<number> {
  const [eggs, hearts] = await Promise.all([eggsFound(), heartsFound()]);
  return (eggs ? GATE_BIT.eggs : 0) | (hearts ? GATE_BIT.hearts : 0);
}

/** FNV-1a of an id: how code that must know a secret game (its box cover) knows it without naming it. */
export function idHash(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

/** Every secret game, by idHash (so the source names none), and what reveals it. */
const SECRETS: Record<number, Gate> = { 0x3cb23e5f: 'eggs', 0x5cdf8e7d: 'hearts' };

/**
 * Whether a game is one of the secret ones, however a list came to name it (a dev server from
 * before games/extra.json lists them in games/index.json): the magazine and the credits never
 * name one, even once it is revealed.
 */
export const isOldSecret = (id: string): boolean => idHash(id) in SECRETS;

/** Whether what reveals a secret game is open in `open` (GATE_BIT); a game that isn't secret always is. */
const shown = (id: string, open: number): boolean => {
  const gate = SECRETS[idHash(id)];
  return !gate || (open & GATE_BIT[gate]) !== 0;
};

/** The secret games' entries (games/extra.json), or undefined when there is no such file. */
async function fetchSecrets<T>(base: string): Promise<T[] | undefined> {
  try {
    const res = await fetch(`${base}extra.json`);
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return undefined;
    const list = (await res.json()) as unknown;
    return Array.isArray(list) ? (list as T[]) : undefined;
  } catch {
    return undefined;
  }
}

let listed: number | undefined;

/** Which gates the last list given out showed the secret games of (undefined: none given out yet). */
export const secretsListed = (): number | undefined => listed;

/**
 * The list as it should show: with the secret games (fetched from `base`extra.json) whose
 * gate is open added, and without any that an older dev server listed in it while still hidden.
 */
export async function withSecretGames<T extends { id: string }>(list: T[], base = './games/'): Promise<T[]> {
  if (!Array.isArray(list)) return list;
  const open = (listed = await secretsRevealed());
  const own = list.some((g) => !shown(g.id, open)) ? list.filter((g) => shown(g.id, open)) : list;
  if (!open) return own;
  const extra = await fetchSecrets<T>(base);
  if (!extra) return own; // an older dev server: they are in the list already
  const have = new Set(own.map((g) => g.id));
  return [...own, ...extra.filter((g) => g && typeof g.id === 'string' && !have.has(g.id) && shown(g.id, open))];
}
