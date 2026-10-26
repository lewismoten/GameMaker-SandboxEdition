// A game's walking paths and roads: games/<id>/walkPaths.json lists, for each block set, the
// background blocks a person would walk along (block numbers by the .bbl's name in lower case),
// the same list the editor keeps in a project's companion file (section "walkPaths" of a .bbl,
// web/src/editor/check/walk/walkPaths.ts). A game's build writes it from its block books' names
// (it is not on the disk: DOS never sees it); its bot reads it with `keepToPaths`, so its
// shortest-path search adds OFF_PATH_COST to every step off them and the recorded walkthrough
// walks the roads instead of cutting across the grass. A game without the file walks as before.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Game } from '../../web/src/formats/game';
import { sceneBbl } from '../../web/src/editor/check/walk/walkPaths';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const pathOf = (id: string) => join(gamesDir, id, 'walkPaths.json');

/** Block numbers by block set (lower case .bbl name). */
type WalkPaths = Record<string, number[]>;

/** What a step off the paths costs on top of the step (1): a road up to half again as long wins. */
export const OFF_PATH_COST = 0.5;

/** Writes games/<id>/walkPaths.json (block sets in name order, each list sorted). */
export function writeWalkPaths(id: string, paths: WalkPaths): void {
  const out: WalkPaths = {};
  for (const k of Object.keys(paths).sort()) if (paths[k].length) out[k.toLowerCase()] = [...new Set(paths[k])].sort((a, b) => a - b);
  writeFileSync(pathOf(id), `${JSON.stringify(out)}\n`);
}

/** games/<id>/walkPaths.json, or none. */
export function readWalkPaths(id: string): WalkPaths {
  return existsSync(pathOf(id)) ? (JSON.parse(readFileSync(pathOf(id), 'utf8')) as WalkPaths) : {};
}

/** The sim a bot plays on: the scene it is in and the block at a cell. */
interface PathSim {
  readonly game: Game;
  readonly scene: number;
  blockAt(x: number, y: number): number;
}

/**
 * The extra cost of stepping onto (x, y) for `sim`'s bot: OFF_PATH_COST off the paths of the
 * scene's block set, 0 on them or in a scene whose block set has none.
 */
export function keepToPaths(sim: PathSim, paths: WalkPaths): (x: number, y: number) => number {
  const sets = new Map(Object.entries(paths).map(([k, v]) => [k, new Set(v)]));
  return (x, y) => {
    const set = sets.get(sceneBbl(sim.game.scenes[sim.scene]?.files ?? []));
    return set && !set.has(sim.blockAt(x, y)) ? OFF_PATH_COST : 0;
  };
}
