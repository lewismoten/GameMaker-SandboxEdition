// Walking paths and roads: the background blocks of a block set (.bbl) that the walkthrough bot
// keeps to, the way a person walks along a road rather than straight across the grass. Kept in
// the project's companion file (editor-only, section "walkPaths" of the .bbl: its block numbers),
// which no DOS, native or web-page export carries. It says how bots walk, not what the game
// does, so a look-only game may keep it in memory (core/readOnly.ts MEMORY_SECTIONS). No DOM:
// the walkthrough's Web Worker reads it too.
import { BACKBL, BLEN } from '../../../formats/blocks';
import type { Game } from '../../../formats/game';
import { MLEN, MWID } from '../../../formats/map';
import type { World } from '../../../engine/world';
import type { Terrain } from '../../editors/map/tools/autotile';

const WALK_PATHS = 'walkPaths';

interface ExtrasStore {
  extras<T>(file: string, section: string, fallback: T): T;
  setExtras(file: string, section: string, value: unknown): void;
}

/** Block numbers made safe: whole, in range, once each, in order. */
function clean(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  const out = new Set<number>();
  for (const x of v) if (typeof x === 'number' && Number.isInteger(x) && x >= 0 && x < BACKBL) out.add(x);
  return [...out].sort((a, b) => a - b);
}

/** The path blocks of one block set. */
export const readWalkPaths = (store: ExtrasStore, bbl: string): number[] => clean(store.extras<unknown>(bbl, WALK_PATHS, []));

/** Sets a block set's path blocks (none removes the section). */
export function setWalkPaths(store: ExtrasStore, bbl: string, blocks: Iterable<number>): void {
  const list = clean([...blocks]);
  store.setExtras(bbl, WALK_PATHS, list.length ? list : undefined);
}

/** The path blocks of every block set the game's scenes use that has any, by the .bbl's name (lower case). */
export function allWalkPaths(store: ExtrasStore, game: Game): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const s of game.scenes) {
    const bbl = sceneBbl(s.files);
    if (!bbl || bbl in out) continue;
    const list = readWalkPaths(store, bbl);
    if (list.length) out[bbl] = list;
  }
  return out;
}

/** A scene's block set, by its name in lower case ('' when it has none). */
export const sceneBbl = (files: readonly string[]): string => files.find((f) => /\.bbl$/i.test(f))?.toLowerCase() ?? '';

/** The path blocks a scene walks on, from `allWalkPaths`'s record (undefined: none). */
export function scenePaths(paths: Record<string, number[]> | undefined, files: readonly string[]): Set<number> | undefined {
  const list = paths?.[sceneBbl(files)];
  return list?.length ? new Set(list) : undefined;
}

/** The map cell under the middle of the hero's feet (the block a player sees him walk on). */
export function footCell(w: Pick<World, 'chr'>): number {
  const c = w.chr;
  const x = Math.floor((c.x[0] * BLEN + c.x[1] + BLEN / 2) / BLEN) % MLEN;
  const y = Math.floor((c.y[0] * BLEN + c.y[1] + BLEN / 2) / BLEN) % MWID;
  return y * MLEN + x;
}

/** Terrain names that say they are walked along. */
const PATHLIKE = /\b(road|path|street|trail|track|sidewalk|pavement|lane|walk|way|bridge|avenue|alley|cobble)/i;

/**
 * A guess at a block set's path blocks from its terrains (map/tools/autotile.ts): every block of
 * a terrain of the 'path' kind (a road one block wide), and of a terrain named like one ("Road",
 * "Dirt path", "Sidewalk"…), but never the ground round a terrain.
 */
export function guessWalkPaths(terrains: readonly Pick<Terrain, 'kind' | 'name' | 'tiles' | 'outside'>[]): number[] {
  const out = new Set<number>();
  for (const t of terrains) {
    if (!t || !Array.isArray(t.tiles) || (t.kind !== 'path' && !PATHLIKE.test(String(t.name)))) continue;
    for (const b of t.tiles) if (b >= 0 && b !== t.outside) out.add(b);
  }
  return clean([...out]);
}
