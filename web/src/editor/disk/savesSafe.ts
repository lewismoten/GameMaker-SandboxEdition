// Which Optimize steps change what a saved game depends on. A save (code/GM/PLAYGAME.C SaveGame,
// ~line 1838) holds the scene numbers, the whole 100x100 map as block numbers, the block-animation
// table (blkmap), the character's block numbers (chr, ci), every live monster by monster number and
// picture number (mi, mm) and the block-born monsters (BlkMon). It holds no pixels, colors, palette
// or file names (the scene's files are read again from the .gam when a save loads). So:
//   safe:  gif (table sizes), pal (palette files), sync and reduce (colors only)
//   not:   mon (monsters change numbers), look (map cells change block), bbl/mbl/cbl when any block
//          lands on another number (a block that keeps its number in the kept file is fine)
import type { BlockMove, Step } from './types';

const renumbers = (moves: readonly BlockMove[] | undefined): boolean => !!moves?.some((m) => [...m.at].some(([from, to]) => from !== to));

/** Why the step would break saved games, or undefined when saves keep working. */
export function savesRisk(s: Pick<Step, 'kind' | 'moves'>): string | undefined {
  if (s.kind === 'mon') return 'monsters change numbers';
  if (s.kind === 'look') return renumbers(s.moves) ? 'map cells change block number' : undefined;
  if (s.kind === 'bbl' || s.kind === 'mbl' || s.kind === 'cbl') return renumbers(s.moves) || !s.moves ? 'blocks change number' : undefined;
  return undefined;
}

/** Step kinds that never touch a saved game: planDisk offers only these while the game has saves. */
export const SAVE_SAFE_KINDS: ReadonlySet<Step['kind']> = new Set(['gif', 'pal', 'sync']);
