// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): the clouds, the
// great plant's two-block stalk (and its branches), the pot, the hand of God, and that their art
// joins up across the block edges. Run by tools/check.ts.
import { alignGame, namesOf, pair, shape, type PartRule } from '../../kit/align';
import { buildPalette } from '../src/art/pal';
import { buildBlocks } from '../src/blocks/blocks';
import { LEVELS } from '../src/levels/levels';

const RULES: PartRule[] = [
  // (and their copies in the deeper evening sky, name~1 or name~2, blocks.ts DUSK_TONED)
  ...pair('rain cloud', /^cloudL(~\d)?$/, /^cloudR(~\d)?$/, 1, 0),
  ...pair('cloud ledge', /^cloudA(~\d)?$/, /^cloudB(~\d)?$/, 1, 0),
  ...pair('stalk', /^(stalkL|branchStalkL)(~\d|~\dto\d)?$/, /^(stalkR|branchStalkR)(~\d|~\dto\d)?$/, 1, 0),
  { part: 'potTop', need: [[0, 1, 'pot']] },
  ...shape(
    'hand',
    [0, 1, 2].map((r) => Array.from({ length: 8 }, (_, c) => `hand${r * 8 + c}`)),
  ),
];

export function align(): number {
  const names = new Map(LEVELS.map((l) => [`${l.file}.map`, namesOf(buildBlocks(buildPalette(l.light)).index)]));
  return alignGame('mustard', (m) => names.get(m), RULES);
}
