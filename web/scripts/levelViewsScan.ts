// Node only (scripts/levelViews.ts, levelViews.test.ts and games/kit/syncCheck.ts): reading a
// game's disk for the Level Maps' seen areas (levelViewsPlay.ts finds them), the hash that says
// levelViews.json is current for it, and the file as the script writes it.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BACKBL, CHARBL, MONBL, parseBlocks } from '../src/formats/blocks';
import { parseGame, type Game } from '../src/formats/game';
import type { LevelViews } from '../src/manual/printables/levelViews';

/** Bump when the scan itself changes what it finds, so every game reads as out of date. */
const VERSION = 2;
/** The disk files that say how a scene plays (a palette doesn't). */
const PLAY_FILES = /\.(gam|map|bbl|mbl|mon|chr|cbl)$/;
/** Block sets, and how many blocks each holds: only their numbers count, not their pictures. */
const BLOCK_SETS: Record<string, number> = { bbl: BACKBL, mbl: MONBL, cbl: CHARBL };

interface Disk {
  game: Game;
  files: Map<string, Uint8Array>;
}

export function readDisk(dir: string): Disk | undefined {
  if (!existsSync(dir)) return undefined;
  const files = new Map(readdirSync(dir).map((n) => [n.toLowerCase(), new Uint8Array(readFileSync(join(dir, n)))]));
  const gam = [...files.keys()].find((n) => n.endsWith('.gam'));
  return gam ? { game: parseGame(files.get(gam)!), files } : undefined;
}

/**
 * What a game's seen areas depend on: the scan's version, how its scenes play (the game, maps,
 * monsters, heroes and every block's numbers, but no picture or palette), its walkthrough and
 * where its tin heart and Easter egg are. Redrawing art leaves it the same.
 */
export function levelViewsHash(gamesDir: string, id: string): string | undefined {
  const d = readDisk(join(gamesDir, id, 'disk'));
  if (!d) return undefined;
  const h = createHash('sha1').update(`v${VERSION}`);
  for (const n of [...d.files.keys()].filter((k) => PLAY_FILES.test(k)).sort()) {
    const b = d.files.get(n)!;
    const count = BLOCK_SETS[n.slice(-3)];
    h.update(n);
    if (count) for (const { pixels: _, ...rest } of parseBlocks(b, count)) h.update(JSON.stringify({ ...rest, xtra: [...rest.xtra] }));
    else h.update(b);
  }
  const walk = join(gamesDir, id, 'walkthrough.json');
  h.update(existsSync(walk) ? readFileSync(walk) : '');
  const about = JSON.parse(readFileSync(join(gamesDir, id, 'about.json'), 'utf8')) as { tinHeart?: unknown; easterEgg?: unknown };
  h.update(JSON.stringify([about.tinHeart, about.easterEgg]));
  return h.digest('hex').slice(0, 16);
}

/** levelViews.json as the script writes it: one game a line. */
export const levelViewsJson = (v: LevelViews): string =>
  `{\n${Object.entries(v)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, g]) => `  ${JSON.stringify(id)}: ${JSON.stringify(g)}`)
    .join(',\n')}\n}\n`;
