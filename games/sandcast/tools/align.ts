// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): the toy truck and
// Gwinn asleep on the patio (six blocks by four, her blinking eye block standing in for cat12),
// and that their art joins up across the block edges. Run by tools/check.ts.
import { alignGame, gridParts, pair, type PartRule } from '../../kit/align';
import { BG } from '../src/blocks/bblocks';

const RULES: PartRule[] = [
  ...pair('truck', 'truckL', 'truckR', 1, 0),
  gridParts(/^(cat)(\d)(\d)$/, new Map([['cat', [6, 4]]]), (o, c, r) => `${o}${c}${r}`, (g) => (g === 'catBlink' ? 'cat12' : g)),
  { part: 'catBlink', need: [[-1, 0, 'cat02'], [1, 0, 'cat22'], [0, -1, 'cat11'], [0, 1, 'cat13']] },
];

export function align(): number {
  return alignGame('sandcast', () => BG.names, RULES, { seamOk: ['cat33|cat43'] }); // (her white paw against her hind leg)
}
