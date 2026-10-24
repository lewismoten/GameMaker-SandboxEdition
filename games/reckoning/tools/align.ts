// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): the doors under their frames, the couch, the bed, and
// that their art joins up across the block edges. Run by tools/check.ts.
import { alignGame, namesOf, pair, type PartRule } from '../../kit/align';
import { buildPalette } from '../src/art/pal';
import { buildBlocks } from '../src/blocks/blocks';
import { LEVELS } from '../src/levels/levels';

const RULES: PartRule[] = [
  ...pair('door', 'doorTop', 'doorway', 0, 1),
  ...pair('bathroom door', 'bathTop', /^bath(Door|Open)$/, 0, 1),
  ...pair('couch', 'couchBack', 'couch', 0, 1),
  { part: 'headboard', need: [[0, 1, /^(headboard|bedSide)$/]] },
  {
    part: 'couch',
    need: [
      [-1, 0, /^couch(Arm)?$/],
      [1, 0, /^couch(Arm)?$/],
    ],
  },
];

/** Joins drawn as edges on purpose (looked at). */
const SEAM_OK = ['headboard/headboard', 'headboard/bedSide', 'couchArm|couch', 'couch|couchArm'];

export function align(): number {
  const names = new Map(LEVELS.map((l) => [`${l.file}.map`, namesOf(buildBlocks(buildPalette(l.light)).index)]));
  return alignGame('reckoning', (m) => names.get(m), RULES, { seamOk: SEAM_OK });
}
