// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): the fig trees'
// trunks up to their branches, the palms, and the baskets' rims on their wicker, and that their
// art joins up across the block edges. Run by tools/check.ts.
import { alignGame, namesOf, type PartRule } from '../../kit/align';
import { buildPalette } from '../src/art/pal';
import { buildBlocks } from '../src/blocks/blocks';
import { LEVELS } from '../src/levels/levels';

const RULES: PartRule[] = [
  { part: /^trunk(Shade)?$/, need: [[0, -1, /^(trunk(Shade)?|fig|leaves)$/]] },
  { part: 'palmC', need: [[0, 1, 'palmT']] },
  { part: 'palmT', need: [[0, -1, /^palm[TC]$/]] },
  { part: /^rim(Ledge)?$/, need: [[0, 1, 'wicker']] },
];

export function align(): number {
  const names = new Map(LEVELS.map((l) => [`${l.file}.map`, namesOf(buildBlocks(buildPalette(l.light)).index)]));
  return alignGame('loaf', (m) => names.get(m), RULES);
}
