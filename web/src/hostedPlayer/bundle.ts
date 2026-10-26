// Saves to take away and bring back: a .zip with one folder per game id holding the files the
// game wrote, as DOS wrote them ("nebula/NEBULA.HIS", "nebula/GAME1.SAV"), so a folder can
// also be copied into a DOS game folder. Importing reads only what fits that shape; anything
// else in the zip is skipped. No DOM here (bundle.test.ts).
import { createZip, readZip } from '../project/zip';
import { gameId, safeFileName } from './list';
import type { SaveFiles } from './saves';

/** The most bytes one imported zip may unpack to (save files are small). */
const MAX_IMPORT_BYTES = 16 * 1024 * 1024;

/** A .zip of the saves, one folder per game. */
export function exportSaveZip(saves: Record<string, SaveFiles>, date = new Date()): Promise<Uint8Array> {
  const entries = Object.entries(saves)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .flatMap(([id, files]) =>
      Object.entries(files)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([name, data]) => ({ name: `${id}/${name.toUpperCase()}`, data })),
    );
  return createZip(entries, date);
}

/** The saves in a zip made by exportSaveZip: game id → files (names lower case, as the engine writes them). */
export async function importSaveZip(bytes: Uint8Array): Promise<Record<string, SaveFiles>> {
  const entries = await readZip(bytes, { maxEntries: 4096, maxBytes: MAX_IMPORT_BYTES });
  const out: Record<string, SaveFiles> = {};
  for (const { name, data } of entries) {
    const parts = name.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.length !== 2) continue;
    const id = gameId(parts[0]);
    const file = safeFileName(parts[1]);
    if (!id || !file || id !== parts[0].toLowerCase()) continue;
    (out[id] ??= {})[file.toLowerCase()] = data;
  }
  return out;
}

/** The download's name: every game's saves, or one game's. */
export const saveZipName = (id?: string) => (id ? `${id}-saves.zip` : 'web-player-saves.zip');
