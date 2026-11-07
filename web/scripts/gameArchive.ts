// One reproducible, standalone DOS ZIP per catalog game, also read by the browser player/editor.
import { readFileSync } from 'node:fs';
import { createZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { exportDos } from '../src/export/exportDos';
import { catalogPatches } from '../src/dosPlayer/catalogPatches';
import type { CdCatalogEntry } from './cdGames';

import { dosDir } from '../src/project/dosDir';

/** Permanent DOS-compatible ZIP basename (its dosDir name, 8.3), independent of game contents and release version. */
export const gameZipName = (g: { id: string; exe?: string; dosName?: string }): string => `${dosDir(g).toLowerCase()}.zip`;

/** The ZIP name a game had before it had a dosName (its id cut to 8): that old link still serves the same file. */
export const legacyZipName = (id: string): string => `${id.slice(0, 8)}.zip`;
/**
 * The games whose old link was ever published: the only ones with an id over 8 characters on the site before dosName
 * (pages-v3.1.0). Every later game only ever had its dosName link, so a second copy of its ZIP would be dead weight
 * (about 14 MB across the Starters).
 */
const PUBLISHED_LEGACY = new Set(['reckoning', 'snowbound']);
/** The extra ZIP name a game is also served under, or undefined when it has only its own. */
export const legacyAlias = (g: { id: string; exe?: string; dosName?: string }): string | undefined =>
  PUBLISHED_LEGACY.has(g.id) && legacyZipName(g.id) !== gameZipName(g) ? legacyZipName(g.id) : undefined;

export async function gameArchive(entry: CdCatalogEntry, paths: ReadonlyMap<string, string>): Promise<Uint8Array> {
  const read = (path: string) => {
    const file = paths.get(path);
    if (!file) throw new Error(`Missing distribution input: ${path}`);
    return new Uint8Array(readFileSync(file));
  };
  const files = new GameFiles(entry.files.map((name) => [name, read(`${entry.path}${name}`)]));
  const date = new Date(2000, 0, 1);
  // The CD also lists reusable resource folders that have no playable .GAM.
  if (!entry.gam)
    return createZip(
      [...files.entries()].map(([name, data]) => ({ name: name.toUpperCase(), data })),
      date,
    );
  const { zip } = await exportDos(files, {
    title: entry.title,
    gam: entry.gam,
    player: catalogPatches(entry),
    date,
    runtime: {
      player: read('dos/xferplay.exe'),
      driver: read('dos/sndblast.drv'),
      help: read('dos/config.hlp'),
    },
  });
  return zip;
}
