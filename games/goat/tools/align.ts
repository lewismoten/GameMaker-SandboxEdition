// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): the manger, the
// inn's NO ROOM sign, the caravan's tents (upper halves over their lower halves, doorways over
// doorways), and that their art joins up across the block edges. Run by tools/check.ts.
import { alignGame, namesOf, pair, type PartRule } from '../../kit/align';
import { buildPalette } from '../src/art/pal';
import { buildBlocks } from '../src/blocks/blocks';

const RULES: PartRule[] = [
  ...pair('manger', 'mangerL', 'mangerR', 1, 0),
  ...pair('inn sign', 'innNo', 'innRoom', 1, 0),
  // (the purple tent's doorway top is plain tentDoor)
  { part: /^tent(Door)?([PBR])Low$/, need: (m) => [[0, -1, m[1] && m[2] === 'P' ? 'tentDoor' : new RegExp(`^tent(Door)?${m[2]}$`)]] },
  { part: /^tentDoor([BR])$/, need: (m) => [[0, 1, `tentDoor${m[1]}Low`]] },
];

export function align(): number {
  const names = namesOf(buildBlocks(buildPalette('day')).index);
  return alignGame('goat', () => names, RULES);
}
