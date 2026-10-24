// Node only (scripts/levelViews.ts, levelViews.test.ts and games/kit/syncCheck.ts): reading a
// game's disk for the Level Maps' seen areas (levelViewsPlay.ts finds them), the hash that says
// levelViews.json is current for it, and the file as the script writes it.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseGame, type Game } from '../src/formats/game';
import type { LevelViews } from '../src/manual/printables/levelViews';

/** Bump when the scan itself changes what it finds, so every game reads as out of date. */
const VERSION = 1;
/** The disk files a scene's play reads. */
const PLAY_FILES = /\.(gam|map|bbl|mbl|mon|chr|cbl|pal)$/;

export interface Disk {
  game: Game;
  files: Map<string, Uint8Array>;
}

export function readDisk(dir: string): Disk | undefined {
  if (!existsSync(dir)) return undefined;
  const files = new Map(readdirSync(dir).map((n) => [n.toLowerCase(), new Uint8Array(readFileSync(join(dir, n)))]));
  const gam = [...files.keys()].find((n) => n.endsWith('.gam'));
  return gam ? { game: parseGame(files.get(gam)!), files } : undefined;
}

/** What a game's seen areas depend on: the scan's version, every file play reads, its walkthrough and about.json. */
export function levelViewsHash(gamesDir: string, id: string): string | undefined {
  const d = readDisk(join(gamesDir, id, 'disk'));
  if (!d) return undefined;
  const h = createHash('sha1').update(`v${VERSION}`);
  for (const n of [...d.files.keys()].filter((k) => PLAY_FILES.test(k)).sort()) h.update(n).update(d.files.get(n)!);
  for (const n of ['walkthrough.json', 'about.json']) {
    const p = join(gamesDir, id, n);
    h.update(n).update(existsSync(p) ? readFileSync(p) : '');
  }
  return h.digest('hex').slice(0, 16);
}

/** levelViews.json as the script writes it: one game a line. */
export const levelViewsJson = (v: LevelViews): string =>
  `{\n${Object.entries(v)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, g]) => `  ${JSON.stringify(id)}: ${JSON.stringify(g)}`)
    .join(',\n')}\n}\n`;
