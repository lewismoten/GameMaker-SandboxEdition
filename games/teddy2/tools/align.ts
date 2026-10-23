// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): every grid of
// parts named <name><col><row> (the doghouse, the hay wagon, the booths, the coop, the moon...),
// the three-block clouds, the pairs (Top over Bot, L beside R), THE CHEZ and Doc Leo beside it,
// and that their art joins up across the block edges. Run by tools/check.ts.
import { alignGame, gridParts, shape, sizesOf, type PartRule } from '../../kit/align';
import { LEVELS } from '../src/game';

// a bone or treat lying on a part is still that part; an animation phase (wheel00_1) too
const strip = (n: string) => n.replace(/^(treat|bone)~/, '').replace(/_\d+$/, '');
// (not the gazebo's roof rows, gzRoofL33: named by map row, not a grid)
const GRID = /^(?!gzRoof)([A-Za-z]+?)(\d)(\d)$/;

/** Joins with a hard edge on purpose (looked at): where a sky band ends at a block edge (the
 * midway's arch, booths and carousel, the bucket truck, the Ferris wheel and the waterwheel
 * over the river), awning and couch stripes that change color right at the edge, and the
 * doghouse's roof over its wall. */
const SEAM_OK = [
  'couch00|couch10', 'stand00|stand10', 'toss10|toss20', 'food10|food20', 'carousel10|carousel20', 'carousel20|carousel30',
  'dogHouse00/dogHouse01', 'dogHouse10/dogHouse11', 'truck00/truck01', 'truck10/truck11', 'truck20/truck21',
  'wheel01/wheel02', 'wheel12/wheel13', 'wheel20/wheel21', 'wheel22/wheel23', 'wheel30/wheel31',
  'arch10/arch11', 'arch20/arch21', 'arch30/arch31', 'toss10/toss11', 'toss11/toss12', 'food10/food11', 'food11/food12',
  'carousel01/carousel02', 'carousel11/carousel12', 'carousel31/carousel32', 'carousel41/carousel42',
  'carousel02/carousel03', 'carousel12/carousel13', 'carousel32/carousel33', 'carousel42/carousel43',
];

export function align(): number {
  const names = new Map<string, string[]>();
  for (const make of LEVELS) {
    const l = make();
    names.set(`${l.file}.map`, l.bs.names);
    if (l.nook) names.set(l.nook.map, l.bs.names);
  }
  // sizes per level: a name can mean another object elsewhere (the river's waterwheel is 2x3,
  // the midway's spin-to-win wheel 3x3)
  const RULES = (map: string): PartRule[] => [
    gridParts(GRID, sizesOf(new Set((names.get(map) ?? []).filter(Boolean).map(strip)), GRID), (o, c, r) => `${o}${c}${r}`),
    { part: 'cloud0', need: [[1, 0, 'cloud1'], [2, 0, 'cloud2']] },
    { part: 'cloud2', need: [[-1, 0, 'cloud1'], [-2, 0, 'cloud0']] },
    ...shape('THE CHEZ', [['carRoofL', 'carRoofR'], [/^car(Door|Open)$/, 'carBack']]),
    ...shape('Doc Leo', [['leoWant'], ['leoHead'], ['leoBody']]),
  ];
  return alignGame('teddy2', (m) => names.get(m)?.map((n) => n && strip(n)), RULES, { seamOk: SEAM_OK });
}
