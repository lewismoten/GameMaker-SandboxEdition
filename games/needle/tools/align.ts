// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): the city arch, the
// palms, the tailor's tent, the robes and cloaks, the back door, the sewing machine, the great
// golden needle (point, shaft, head and eye), and that their art joins up across the block edges.
// Run by tools/check.ts.
import { alignGame, namesOf, pair, shape, type PartRule } from '../../kit/align';
import { buildPalette } from '../src/art/pal';
import { LEVELS } from '../src/levels/levels';

const shaftL = /^shaftL\d$/;
const shaftR = /^shaftR\d$/;
const RULES: PartRule[] = [
  ...shape('arch', [['archL', 'archM', 'archR']]),
  { part: 'palmTop', need: [[0, 1, 'palm']] },
  ...shape('tent', [
    ['tent0', 'tent1', 'tent2'],
    ['tentWall', 'tentSign', 'tentWallR'],
    ['tentWall', 'tentDoor', 'tentWallR'],
  ]),
  ...pair('robe', 'robe0', 'robe1', 0, 1),
  ...pair('cloak', 'cloak0', 'cloak1', 0, 1),
  ...pair('back door', 'doorTop', 'door', 0, 1),
  ...shape('sewing machine', [
    ['machine0', 'machine1', 'machineArm'],
    [null, null, 'machineWheel'],
  ]),
  {
    part: 'machinePillar',
    need: [
      [0, -1, /^machine(Pillar|Wheel)$/],
      [0, 1, /^machine(Pillar|Base)$/],
    ],
  },
  ...shape('machine bed', [['machineBedL', 'machineBed', 'machineBase']]),
  // the needle: its eye's head over the shaft, the shaft (with its eye gate) down to the point
  ...shape(
    'needle head',
    Array.from({ length: 7 }, (_, y) => [`head${y}L`, y === 5 ? /^(head5R|pupil(Open)?)$/ : `head${y}R`]),
  ),
  { part: 'head6L', need: [[0, 1, shaftL]] },
  { part: 'head6R', need: [[0, 1, shaftR]] },
  // (its eye gate: gate and hole across the shaft; gates elsewhere stand alone)
  {
    part: 'hole',
    need: [
      [-1, 0, 'gate'],
      [0, -1, shaftR],
      [0, 1, shaftR],
    ],
  },
  {
    part: shaftL,
    need: [
      [1, 0, /^(shaftR\d|hole)$/],
      [0, 1, /^(shaftL\d|gate|pointL)$/],
    ],
  },
  {
    part: shaftR,
    need: [
      [-1, 0, /^(shaftL\d|gate)$/],
      [0, 1, /^(shaftR\d|hole|pointR)$/],
    ],
  },
  ...pair('needle point', 'pointL', 'pointR', 1, 0),
];

/** Joins drawn as edges on purpose (looked at): the eye gate's hole is cut through the shaft. */
const SEAM_OK = ['gate|hole', 'hole/shaftR3'];

export function align(): number {
  const names = new Map(LEVELS.map((l) => [`${l.file}.map`, namesOf(l.blocks(buildPalette(l.light)).book.index)]));
  return alignGame('needle', (m) => names.get(m), RULES, { seamOk: SEAM_OK });
}
