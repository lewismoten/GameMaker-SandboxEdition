// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): the cage racks,
// the four Dutch doors, the chalkboard over its tray, the desks and benches over their legs, and
// that their art joins up across the block edges. Run by tools/check.ts.
import { alignGame, namesOf, pair, type PartRule } from '../../kit/align';
import { buildPalette } from '../src/art/pal';
import { buildBlocks } from '../src/blocks/blocks';
import { LEVELS } from '../src/levels/levels';

const RULES: PartRule[] = [
  { part: 'cageTop', need: [[0, 1, /^cage(Top)?$/]] },
  { part: 'cage', need: [[0, -1, /^cage(Top)?$/]] },
  ...[0, 1, 2, 3].flatMap((i) => pair(`door ${i}`, `doorTop${i}`, new RegExp(`^gate(Open|Past)?${i}$`), 0, 1)),
  ...[1, 2, 3].flatMap((i) => pair('chalkboard', `board${i}`, `board${i + 1}`, 1, 0)),
  ...[1, 2, 3, 4].map((i): PartRule => ({ part: `board${i}`, need: [[0, 1, 'boardTray']] })),
  ...(['desk', 'bench'] as const).flatMap((t): PartRule[] => [
    ...pair(t, t, `${t}Leg`, 0, 1),
    { part: `${t}Mid`, need: [[-1, 0, new RegExp(`^${t}(Mid)?$`)], [1, 0, new RegExp(`^${t}(Mid)?$`)]] },
  ]),
];

export function align(): number {
  const names = new Map(LEVELS.map((l) => [`${l.file}.map`, namesOf(buildBlocks(buildPalette(l.light)).index)]));
  return alignGame('tickle', (m) => names.get(m), RULES);
}
