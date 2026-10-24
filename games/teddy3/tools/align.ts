// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): every grid of
// parts named <name><col><row> (the washer, the bike, the charger...),
// the three-block clouds, the pairs (Top over Bot, L beside R), THE CHEZ and Doc Leo beside it,
// and that their art joins up across the block edges. Run by tools/check.ts.
import { alignGame, gridParts, shape, sizesOf, type PartRule } from '../../kit/align';
import { LEVELS } from '../src/game';

// a bone or treat lying on a part is still that part; an animation phase (wheel00_1) too
const strip = (n: string) => n.replace(/^(treat|bone)~/, '').replace(/_\d+$/, '');
const GRID = /^([A-Za-z]+?)(\d)(\d)$/;

/** Hard edges on purpose: the park gate's sign board ends at a block edge; the far trees meet
 * the lawn behind the lamppost; sky bands change behind the mill's big hub and the well's roof. */
const SEAM_EDGES = ['gate10|gate20', 'lamp01/lamp02', 'bigHub01/bigHub02', 'wellTop00/wellTop01', 'wellTop10/wellTop11', 'wellTop20/wellTop21'];
/** Objects whose stripes, awnings or sky bands change right at block edges (looked at): the Big
 * Top's red and white stripes, the midway's booths and arch (as in the sequel), the willow, the
 * party cake's tiers. */
const SEAM_OBJECTS = ['bigTop', 'booth', 'toss', 'stand', 'arch', 'willow', 'cake'];
const SEAM_OK: string[] = [
  ...SEAM_EDGES,
  ...SEAM_OBJECTS.flatMap((o) =>
    Array.from({ length: 8 }, (_, c) => Array.from({ length: 8 }, (_, r) => [`${o}${c}${r}|${o}${c + 1}${r}`, `${o}${c}${r}/${o}${c}${r + 1}`])).flat(2),
  ),
];

export function align(): number {
  const names = new Map<string, string[]>();
  for (const make of LEVELS) {
    const l = make();
    names.set(`${l.file}.map`, l.bs.names);
    if (l.nook) names.set(l.nook.map, l.bs.names);
  }
  // sizes per level: a name can mean another object elsewhere
  const RULES = (map: string): PartRule[] => [
    gridParts(GRID, sizesOf(new Set((names.get(map) ?? []).filter(Boolean).map(strip)), GRID), (o, c, r) => `${o}${c}${r}`),
    {
      part: 'cloud0',
      need: [
        [1, 0, 'cloud1'],
        [2, 0, 'cloud2'],
      ],
    },
    {
      part: 'cloud2',
      need: [
        [-1, 0, 'cloud1'],
        [-2, 0, 'cloud0'],
      ],
    },
    ...shape('THE CHEZ', [
      ['carRoofL', 'carRoofR'],
      [/^car(Door|Open)$/, 'carBack'],
    ]),
    ...shape('Doc Leo', [['leoWant'], ['leoHead'], ['leoBody']]),
  ];
  return alignGame('teddy3', (m) => names.get(m)?.map((n) => n && strip(n)), RULES, { seamOk: SEAM_OK });
}
