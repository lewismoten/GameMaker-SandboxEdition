// The Optimize tool's checkpoint: a named stamp of the whole game (every file and the editor-only
// companion) kept in the game's own stored record (storage.ts `checkpoint`), so it lives with My
// games and the browser backup, never in the game's files and never in a DOS, native or web
// export. One per game. Restoring is worked out here as plain file changes; the editor applies
// them through the file history so Undo takes a restore back.
import type { GameFiles } from './files';
import type { Companion } from './companion';
import { loadCheckpoint, saveCheckpoint, type StoredCheckpoint } from './storage';

/** Stamps the game as it is now, replacing any earlier checkpoint. */
export async function makeCheckpoint(id: string, name: string, files: GameFiles, companion?: Companion): Promise<StoredCheckpoint> {
  const cp: StoredCheckpoint = {
    name,
    made: Date.now(),
    files: Object.fromEntries(files.entries()),
    ...(companion ? { companion: structuredClone(companion) } : {}),
  };
  await saveCheckpoint(id, cp);
  return cp;
}

export const getCheckpoint = loadCheckpoint;
export const discardCheckpoint = (id: string): Promise<void> => saveCheckpoint(id, undefined);

/** The checkpoint's files as a game directory, for looking at without touching the open game. */
export function checkpointFiles(cp: StoredCheckpoint, make: (entries: [string, Uint8Array][]) => GameFiles): GameFiles {
  return make(Object.entries(cp.files));
}

/** What restoring changes: new bytes per file, null where the file did not exist at the checkpoint. Untouched files are left out. */
export function restoreChanges(current: GameFiles, cp: StoredCheckpoint): Map<string, Uint8Array | null> {
  const out = new Map<string, Uint8Array | null>();
  for (const [n, b] of Object.entries(cp.files)) {
    const now = current.get(n);
    if (!now || now.length !== b.length || now.some((v, i) => v !== b[i])) out.set(n, b);
  }
  for (const n of current.names()) if (!(n in cp.files)) out.set(n, null);
  return out;
}
