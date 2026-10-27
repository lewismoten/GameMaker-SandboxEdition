// Where the MCP server finds games: folders holding a .gam (and zips of them) in its roots, this
// repository's own games (games/<id>, read from its built disk/, the secret ones left out) and
// the CD's sample games (cd/gameware/<id>). Loading one gives its files, its .gam and its DOS
// player patches (a folder's or zip's <game>.GMX companion, or a game's player.json).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { GameFiles } from '../../src/project/files';
import { readZip } from '../../src/project/zip';
import { takeCompanion } from '../../src/project/companion';
import { companionPatches, recordPatches } from '../../src/dosPlayer/playerRecord';
import { parseGame } from '../../src/formats/game';
import type { PlayerPatches } from '../../src/dosPlayer/patchRules';
import { ToolError } from '../../src/assistant/tools/types';
import { CD_GAMES_DIR, GAMES_DIR, type Roots } from './roots';

export interface Loaded {
  files: GameFiles;
  gam: string;
  patches: PlayerPatches;
  /** A folder that can be edited where it is (inside a writable root). */
  folder?: string;
  /** A short name for copies. */
  stem: string;
}

export interface Listed {
  source: string;
  title: string;
  kind: 'folder' | 'zip' | 'sandbox' | 'cd';
  writable: boolean;
}

const isSecret = (id: string) => {
  try {
    return !!(JSON.parse(readFileSync(join(GAMES_DIR, id, 'about.json'), 'utf8')) as { secret?: boolean }).secret;
  } catch {
    return false;
  }
};

/** A folder's files (not its subfolders). */
function readFolder(dir: string): GameFiles {
  const files = new GameFiles();
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isFile()) files.put(n, new Uint8Array(readFileSync(p)));
  }
  return files;
}

const titleOf = (files: GameFiles, gam: string) => {
  try {
    return parseGame(files.get(gam)!).scenes[0]?.desc.trim() || gam;
  } catch {
    return gam;
  }
};

function pick(files: GameFiles, gam: string | undefined, where: string): string {
  const g = gam ? files.resolve(gam) : files.mainGame();
  if (!g) throw new ToolError(gam ? `${where} has no ${gam}.` : `${where} has no .gam file.`);
  return g;
}

/** Loads a game: "sandbox:<id>", "cd:<id>", or a folder or .zip path inside the roots. */
export async function loadGame(source: string, roots: Roots, gam?: string): Promise<Loaded> {
  const m = /^(sandbox|cd):([a-z0-9_-]+)$/i.exec(source.trim());
  if (m) {
    const id = m[2].toLowerCase();
    if (m[1].toLowerCase() === 'sandbox') {
      const disk = join(GAMES_DIR, id, 'disk');
      if (!existsSync(disk) || isSecret(id)) throw new ToolError(`There is no game sandbox:${id}.`);
      const files = readFolder(disk);
      const g = pick(files, gam, source);
      const player = join(GAMES_DIR, id, 'player.json');
      const patches = existsSync(player) ? recordPatches(JSON.parse(readFileSync(player, 'utf8'))) : {};
      return { files, gam: g, patches, stem: id };
    }
    const dir = join(CD_GAMES_DIR, id);
    if (!existsSync(dir)) throw new ToolError(`There is no game cd:${id}.`);
    const files = readFolder(dir);
    return { files, gam: pick(files, gam, source), patches: {}, stem: id };
  }
  const path = roots.readable(source);
  if (!existsSync(path)) throw new ToolError(`${source} does not exist.`);
  if (statSync(path).isDirectory()) {
    const files = readFolder(path);
    const companion = takeCompanion(files);
    const g = pick(files, gam, source);
    return { files, gam: g, patches: companionPatches(companion, g), folder: roots.isWritable(path) ? path : undefined, stem: basename(path) };
  }
  if (!/\.zip$/i.test(path)) throw new ToolError(`${source} is not a folder or a .zip.`);
  const entries = await readZip(new Uint8Array(readFileSync(path)), { maxEntries: 2000, maxBytes: 200 << 20 });
  const files = new GameFiles();
  // the files beside the chosen .gam (a zip may hold a folder, or several games)
  const gams = entries.filter((e) => /\.gam$/i.test(e.name) && !e.name.endsWith('/'));
  const chosen = gam ? gams.find((e) => basename(e.name).toLowerCase() === gam.toLowerCase()) : gams[0];
  if (!chosen) throw new ToolError(`${source} has no ${gam ?? '.gam file'}.`);
  const dir = chosen.name.slice(0, chosen.name.length - basename(chosen.name).length);
  for (const e of entries) if (e.name.startsWith(dir) && !e.name.slice(dir.length).includes('/') && !e.name.endsWith('/')) files.put(e.name, e.data);
  const companion = takeCompanion(files);
  const g = pick(files, basename(chosen.name), source);
  return { files, gam: g, patches: companionPatches(companion, g), stem: basename(path).replace(/\.zip$/i, '') };
}

/** Every game the server can open: in the roots (one folder deep), this repository's and the CD's. */
export function listGames(roots: Roots): Listed[] {
  const out: Listed[] = [];
  const seen = new Set<string>();
  const folder = (dir: string, kind: Listed['kind'], source: string) => {
    try {
      const files = readFolder(dir);
      const g = files.mainGame();
      if (g && !seen.has(dir)) {
        seen.add(dir);
        out.push({ source, title: titleOf(files, g), kind, writable: kind === 'folder' && roots.isWritable(dir) });
      }
    } catch {
      /* unreadable: skipped */
    }
  };
  for (const root of roots.read.slice(0, -2)) {
    if (!existsSync(root)) continue;
    folder(root, 'folder', root);
    for (const n of readdirSync(root)) {
      const p = join(root, n);
      try {
        if (statSync(p).isDirectory()) folder(p, 'folder', p);
        else if (/\.zip$/i.test(n)) out.push({ source: p, title: n, kind: 'zip', writable: false });
      } catch {
        /* skipped */
      }
    }
  }
  for (const id of existsSync(GAMES_DIR) ? readdirSync(GAMES_DIR).sort() : [])
    if (existsSync(join(GAMES_DIR, id, 'disk')) && !isSecret(id)) folder(join(GAMES_DIR, id, 'disk'), 'sandbox', `sandbox:${id}`);
  for (const id of existsSync(CD_GAMES_DIR) ? readdirSync(CD_GAMES_DIR).sort() : []) folder(join(CD_GAMES_DIR, id), 'cd', `cd:${id}`);
  return out;
}
