// The three background sets (a .BBL holds 150 blocks), each shared by two levels: see villa.ts,
// campus.ts and thermae.ts for what each block is and does.
import type { Pal } from '../art/pal';
import { buildCampus } from './campus';
import type { BlockBook, BlockSet } from './common';
import { buildThermae } from './thermae';
import { buildVilla } from './villa';

export type { BlockBook, BlockSet };
export { GRAV, LEDGE, SOLID } from './common';

export const SETS: BlockSet[] = ['villa', 'campus', 'thermae'];

export function buildBlocks(set: BlockSet, pal: Pal): BlockBook {
  return set === 'villa' ? buildVilla(pal) : set === 'campus' ? buildCampus(pal) : buildThermae(pal);
}
