// Secret games: an original game (games/<id>) whose about.json says "secret": true stays out
// of every listing that goes through loadCatalog / loadCatalogList (the desk shelf, the home
// page, the retro PC's drives, the catalog printables, the play page) until all eight felt
// eggs are found (eggs/eggState.ts: held in a game's save, or added with EGG.EXE).
//
// Nothing the site serves up front names them: the build (web/scripts/cdGames.ts) leaves
// them out of games/index.json, games/catalog.json, the pages, sitemap and pictures, and
// writes them to games/extra.json alone, which is fetched only once the eggs are all found.
// No id is written here either.

/** True once every egg counts as found. Never throws (no IndexedDB, no eggs: still hidden). */
export async function secretsRevealed(): Promise<boolean> {
  try {
    // A dynamic import: eggState reads saves through project/storage, which imports files.ts.
    const { eggStates } = await import('../eggs/eggState');
    const states = await eggStates();
    return states.length > 0 && states.every((s) => s.found);
  } catch {
    return false;
  }
}

/** FNV-1a of an id: how code that must know a secret game (its box cover) knows it without naming it. */
export function idHash(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

/**
 * Secret games a dev server started before games/extra.json existed still lists in
 * games/index.json, by idHash (so the source names none). Only that server needs it.
 */
const OLD_SECRETS: readonly number[] = [0xe1c9f99f];

/** Whether a dev server from before games/extra.json would list this game in the open. */
export const isOldSecret = (id: string): boolean => OLD_SECRETS.includes(idHash(id));

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

let listed: boolean | undefined;

/** Whether the last list given out showed the secret games (undefined: none given out yet). */
export const secretsListed = (): boolean | undefined => listed;

/**
 * The list as it should show: with the secret games (fetched from `base`extra.json) added
 * once they are revealed, and without any an older dev server listed in it until then.
 */
export async function withSecretGames<T extends { id: string }>(list: T[], base = './games/'): Promise<T[]> {
  if (!Array.isArray(list)) return list;
  listed = await secretsRevealed();
  if (!listed) return list.some((g) => isOldSecret(g.id)) ? list.filter((g) => !isOldSecret(g.id)) : list;
  const extra = await fetchSecrets<T>(base);
  if (!extra) return list; // an older dev server: they are in the list already
  const have = new Set(list.map((g) => g.id));
  return [...list, ...extra.filter((g) => g && typeof g.id === 'string' && !have.has(g.id))];
}
