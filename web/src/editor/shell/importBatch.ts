// Which import brought each imported game in, so the games of one import (a folder of 200
// zips) can be removed together, and which games "Remove all imported…" takes. Kept in this
// browser beside the Imported marks (homeOrigin.ts), never in a game's files.
const KEY = 'gm-import-batch';

function read(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function write(map: Record<string, string>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* not remembered: those games can still be removed with all the imported ones */
  }
}

/** A new import's id. */
export function newBatch(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Remembers that these projects came in with import `batch`. */
export function markBatch(ids: string[], batch: string): void {
  if (!ids.length) return;
  const map = read();
  for (const id of ids) map[id] = batch;
  write(map);
}

/** Forgets these projects' imports (they were removed). */
export function forgetBatch(ids: string[]): void {
  const map = read();
  let changed = false;
  for (const id of ids)
    if (id in map) {
      delete map[id];
      changed = true;
    }
  if (changed) write(map);
}

/**
 * The projects to remove: those listed under Imported (not My games, nor one moved from
 * Imported to My games), and of import `batch` only when one is given.
 */
export function importedToRemove<P extends { id: string }>(
  projects: P[],
  isImported: (id: string) => boolean,
  batch?: string,
  batchOf = (id: string) => read()[id],
): P[] {
  return projects.filter((p) => isImported(p.id) && (batch === undefined || batchOf(p.id) === batch));
}
