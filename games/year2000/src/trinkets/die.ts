// The wrong-number die: a teal die for choosing which phone booth to dial, and nothing about it is right. The exchange has booths 1, 2, 3 (Boca
// Raton, the sea floor, inside a TV) and 4, which is out of order, so those are four faces. The other two are a 7 (there is no booth 7) on top and a
// bare 0 underneath (no such number). Opposite faces sum to 4, 6 and 7, not 7, 7, 7 (the paper balloon cube, in the box viewer, has the same six
// faces). The 4 is out of order: its fourth pip is a red nub instead of a dimple. White dimples, one red nub, and it prints on its flat 0.
import { roundBox3, sphere3, subtract3, union3, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const SIZE = 20;
const H = SIZE / 2;
const PIP = 2.3;
const SINK = PIP * 0.75;
const TEAL: Rgb = [63, 224, 208];
const WHITE: Rgb = [250, 248, 236];
const RED: Rgb = [226, 40, 48];
const LOWER = 1.05;
const s = SIZE * 0.25;

type P = [number, number];
const GRIDS: Record<number, P[]> = {
  1: [[0, 0]],
  2: [
    [-s, s],
    [s, -s],
  ],
  3: [
    [-s, s],
    [0, 0],
    [s, -s],
  ],
  4: [
    [-s, s],
    [s, s],
    [-s, -s],
    [s, -s],
  ],
  7: [
    [-s, s],
    [s, s],
    [-s, 0],
    [0, 0],
    [s, 0],
    [-s, -s],
    [s, -s],
  ],
};
type V3 = [number, number, number];
/** Each face's pips, and its frame (center, right, up) as the paper cube has them: +z 7, +x 1, -y 2, -x 3, +y 4 (out of order). 0 is the flat bottom. */
const FACES: { pips: number; o: V3; right: V3; up: V3 }[] = [
  { pips: 7, o: [0, 0, SIZE], right: [0, -1, 0], up: [1, 0, 0] },
  { pips: 1, o: [H, 0, H], right: [0, 1, 0], up: [0, 0, 1] },
  { pips: 2, o: [0, -H, H], right: [1, 0, 0], up: [0, 0, 1] },
  { pips: 3, o: [-H, 0, H], right: [0, -1, 0], up: [0, 0, 1] },
  { pips: 4, o: [0, H, H], right: [-1, 0, 0], up: [0, 0, 1] },
];
const out = (f: (typeof FACES)[number]): V3 => [
  f.right[1] * f.up[2] - f.right[2] * f.up[1],
  f.right[2] * f.up[0] - f.right[0] * f.up[2],
  f.right[0] * f.up[1] - f.right[1] * f.up[0],
];

const dimples: D3[] = [];
let nub: D3 = () => 1e9;
for (const f of FACES) {
  const n = out(f);
  GRIDS[f.pips].forEach(([r, u], i) => {
    const c = [0, 1, 2].map((k) => f.o[k] + r * f.right[k] + u * f.up[k]) as V3;
    if (f.pips === 4 && i === 3) nub = sphere3(...c, PIP * 0.85); // the dead pip: a nub that sticks out
    else dimples.push(sphere3(...(c.map((v, k) => v + n[k] * (PIP - SINK)) as V3), PIP));
  });
}
const pips = union3(...dimples);
const cube = subtract3(roundBox3(0, 0, H, H, H, H, SIZE * 0.18), ...dimples);
const body = union3(cube, nub);

export const wrongNumberDie = (): FieldTrinketInput => ({
  // sunk a little, so the rounded bottom edge is cut flat where it leans 45 degrees
  mm: (x, y, z) => Math.max(body(x, y, z + LOWER), -z),
  colorAt: (x, y, z) => (nub(x, y, z + LOWER) < 0.35 ? RED : pips(x, y, z + LOWER) < 0.35 ? WHITE : TEAL),
  box: { min: [-H - 2, -H - 2, -0.5], max: [H + 2, H + 2, SIZE + 1] },
  bodyCell: 0.3,
  palette: [TEAL, WHITE, RED],
});
