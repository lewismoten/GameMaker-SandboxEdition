// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): the TV, the coffee table, the fridge and the five-by-two couch, and
// that their art joins up across the block edges. Run by tools/check.ts.
import { alignGame, namesOf, pair, shape, type PartRule } from '../../kit/align';
import { buildPalette } from '../src/art/pal';
import { buildBlocks } from '../src/blocks/blocks';
import { LEVELS } from '../src/levels/levels';

const RULES: PartRule[] = [
  ...pair('TV', 'tvL', 'tvR', 1, 0),
  ...pair('TV snow', /^tvSnowL2?$/, /^tvSnowR2?$/, 1, 0),
  ...pair('TV cooking', /^tvCookL2?$/, 'tvCookR', 1, 0),
  ...pair('coffee table', 'tableL', 'tableR', 1, 0),
  ...pair('fridge', /^(fridgeTop|freezerOpen)$/, /^fridge(Open)?$/, 0, 1),
  // the couch: arms and seats over its back; any seat cushion fits any seat column
  ...shape('couch', [
    ['couchArmL', /^(cushion2?|cushionUp2?|couchSeat|couchSat)$/, /^(cushion2?|cushionUp2?|couchSeat|couchSat)$/, /^(cushion2?|cushionUp2?|couchSeat|couchSat)$/, 'couchArmR'],
    ['couchBackL', 'couchBack', 'couchBack2', 'couchBack3', 'couchBackR'],
  ]),
];

/** Joins drawn as edges on purpose (looked at). */
const SEAM_OK = ['fridgeTop/fridge'];

export function align(): number {
  const names = new Map(LEVELS.map((l) => [`${l.file}.map`, namesOf(buildBlocks(buildPalette(l.light)).index)]));
  return alignGame('remote', (m) => names.get(m), RULES, { seamOk: SEAM_OK });
}
