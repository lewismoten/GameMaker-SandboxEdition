// The blocks a background set's maps draw, and what they turn into: what a join or a fold has to keep.
import { BACKBL, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { GameFiles } from '../../project/files';
import { filesIn, usersOf, type SceneUse } from './refs';

/** The blocks a set's maps draw, and what they follow through "becomes" links. */
export function drawn(files: GameFiles, uses: SceneUse[], bbl: string, blocks: Block[]): Set<number> {
  const used = new Set<number>();
  for (const map of filesIn(usersOf(uses, 'bbl', bbl), 'map')) for (const cell of parseMap(files.get(map)!).blocks) used.add(cell);
  for (const i of [...used]) {
    for (let n = blocks[i]?.nextBl, guard = 0; n !== undefined && !used.has(n) && n < BACKBL && guard < BACKBL; guard++, n = blocks[n]?.nextBl) used.add(n);
    const t = blocks[i]?.touchBl;
    if (t !== undefined && t < BACKBL) used.add(t);
  }
  return used;
}
