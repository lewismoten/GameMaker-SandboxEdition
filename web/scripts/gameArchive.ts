// One reproducible, standalone DOS ZIP per catalog game, also read by the browser player/editor.
import { readFileSync } from 'node:fs';
import { createZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { exportDos } from '../src/export/exportDos';
import { catalogPatches } from '../src/dosPlayer/catalogPatches';
import type { CdCatalogEntry } from './cdGames';

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
