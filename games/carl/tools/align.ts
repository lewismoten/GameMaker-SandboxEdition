// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): the windows, the
// TV, the man on the couch, the sleeper, the dog bed, posts, stems, the boom mic, the shelf, the
// fridge, the floor lamp, the tree and the tall cactus, and that their art joins up across the
// block edges. Run by tools/check.ts.
import { alignGame, namesOf, shape, type PartRule } from '../../kit/align';
import { buildPalette } from '../src/art/pal';
import { buildHouse } from '../src/blocks/house';
import { buildYard } from '../src/blocks/yard';
import { LEVELS } from '../src/levels/levels';

const quad = (what: string, tl: string | RegExp, tr: string | RegExp, bl: string | RegExp, br: string | RegExp) =>
  shape(what, [
    [tl, tr],
    [bl, br],
  ]);
const RULES: PartRule[] = [
  ...quad('window', 'winTL', 'winTR', 'winBL', 'winBR'),
  ...quad('open window', 'owTL', 'owTR', 'owBL', 'owBR'),
  ...quad('TV', /^tvTL[01]$/, /^tvTR[01]$/, 'tvBL', 'tvBR'),
  ...shape('man on the couch', [
    [/^(man|glum)TL$/, /^(man|glum)TR$/],
    ['manML', 'manMR'],
    ['manBL', 'manBR'],
  ]),
  ...shape('sleeper', [['sleepL', 'sleepR']]),
  ...shape('dog bed', [['dogBedL', 'dogBedR']]),
  { part: 'postTop', need: [[0, 1, 'post']] },
  { part: 'post', need: [[0, -1, /^post(Top)?$/]] },
  { part: 'stemTop', need: [[0, 1, 'stem']] },
  { part: 'boom', need: [[0, -1, 'boomPole']] },
  { part: /^sash(Open)?$/, need: [[0, -1, 'sashTop']] },
  { part: 'shelf', need: [[0, -1, /^shelf(Top)?$/]] },
  { part: 'fridgeTop', need: [[0, 1, /^fridge(Art)?$/]] },
  { part: /^fridge(Art)?$/, need: [[0, -1, /^fridge(Top|Art)?$/]] },
  { part: /^shade(On)?$/, need: [[0, 1, /^(pole[RP]?|lampBase)$/]] },
  {
    part: /^pole[RP]?$/,
    need: [
      [0, -1, /^(pole[RP]?|shade(On)?)$/],
      [0, 1, /^(pole[RP]?|lampBase)$/],
    ],
  },
  { part: 'trunk', need: [[0, -1, /^(trunk|branch|leaves)$/]] },
  { part: 'cactusTop', need: [[0, 1, 'cactus']] },
  { part: 'cactus', need: [[0, -1, { test: (g) => g !== 'cactus', toString: () => 'no whole cactus' }]] },
];

/** Joins drawn as edges on purpose (looked at). */
const SEAM_OK = ['shelfTop/shelf', 'sashTop/sash', 'manTL/manML', 'manTR/manMR', 'manMR/manBR', 'glumTL/manML', 'glumTR/manMR'];

export function align(): number {
  const pal = buildPalette('day');
  const sets = { house: namesOf(buildHouse(pal).index), yard: namesOf(buildYard(pal).index) };
  const names = new Map(LEVELS.map((l) => [`${l.file}.map`, sets[l.set as keyof typeof sets]]));
  return alignGame('carl', (m) => names.get(m), RULES, { seamOk: SEAM_OK });
}
