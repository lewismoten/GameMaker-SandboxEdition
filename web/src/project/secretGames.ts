// Secret games: an original game (games/<id>) whose about.json says "secret": true stays out
// of every listing that goes through loadCatalog / loadCatalogList (the desk shelf, the home
// page, the retro PC's drives, the catalog printables, the play page) until all eight felt
// eggs are found (eggs/eggState.ts: held in a game's save, or added with EGG.EXE).
//
// The catalog build (web/scripts/cdGames.ts) does not copy about.json's "secret" flag into
// the catalog, so the ids are listed here as well; keep the two in step.
export const SECRET_GAMES: readonly string[] = ['brief'];

export const isSecretGame = (id: string): boolean => SECRET_GAMES.includes(id);

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

let listed: boolean | undefined;

/** Whether the last list given out showed the secret games (undefined: none given out yet). */
export const secretsListed = (): boolean | undefined => listed;
/** Notes what the lists now show (project/catalogWatch.ts, when it forgets the catalog). */
export const noteSecretsListed = (revealed: boolean): void => void (listed = revealed);

/** The list without the secret games, unless they have been revealed. */
export async function hideSecretGames<T extends { id: string }>(list: T[]): Promise<T[]> {
  if (!Array.isArray(list) || !list.some((g) => isSecretGame(g.id))) return list;
  listed = await secretsRevealed();
  return listed ? list : list.filter((g) => !isSecretGame(g.id));
}
