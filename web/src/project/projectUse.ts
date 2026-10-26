// When each game of yours was last played or opened in the editor, so the home page's
// "Continue where you left off" shows the game you used last, not the one an import saved
// last (an import of 200 zips saves each game as it comes in). Kept in this browser
// (localStorage), never in a game's files. No DOM.
const KEY = 'gm-project-used';

type UseMap = Record<string, number>;

function read(): UseMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as UseMap;
  } catch {
    return {};
  }
}

function write(map: UseMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* not remembered: the game saved last is shown instead */
  }
}

/** Remembers that the game was played or opened just now. */
export function markUsed(id: string, now = Date.now()): void {
  write({ ...read(), [id]: now });
}

/** Forgets a removed game's use. */
export function forgetUsed(id: string): void {
  const map = read();
  if (!(id in map)) return;
  delete map[id];
  write(map);
}

/**
 * The game to carry on with: the one played or opened last. A game never played or opened
 * counts from its last save, unless it came in with an import of several (`batched`): those
 * were saved by the import, not by you. Undefined when no game has been used.
 */
export function lastUsed<P extends { id: string; updated: number }>(projects: P[], batched: (id: string) => boolean, used: UseMap = read()): P | undefined {
  let best: P | undefined;
  let bestAt = 0;
  for (const p of projects) {
    const at = used[p.id] ?? (batched(p.id) ? 0 : p.updated);
    if (at > bestAt) [best, bestAt] = [p, at];
  }
  return best;
}
