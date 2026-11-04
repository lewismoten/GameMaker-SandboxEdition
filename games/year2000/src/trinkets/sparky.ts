// Sparky 3000, Dex's chrome robot dog, as the game's sprite draws him (art in sprites/sprites.ts dogPic): a boxy chrome body with a red
// collar, a big round head with a square snout, a dark nose and eyes, perked ears, four stout legs with paws, a wagging antenna tail with
// a red light, and the cover page of Dex's science report hanging from his mouth. He faces +y. He stands on four paws; the ears and
// antenna lean only a little, and every slender part is at least 3 mm thick.
import { figure, ellipsoid3, roundCone3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import { roundBox3, sphere3, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const CHROME: Rgb = [196, 208, 232];
const RED: Rgb = [226, 40, 48];
const PAPER: Rgb = [250, 242, 214];
const INK: Rgb = [28, 22, 44];
const DENIM: Rgb = [60, 96, 168];

const body = roundBox3(0, -2, 18, 6.8, 12.5, 6.5, 5.6);
// the collar: a slice of the body a little fatter than it, at the neck
const collar: D3 = (x, y, z) => Math.max(body(x, y, z) - 0.6, Math.abs(y - 9) - 1.5);
// four legs (hip to ankle) and the paws, which reach a little forward
const legs = [-4.6, 4.6].flatMap((x) => [-9.5, 7.5].map((y) => roundCone3(x, y, 13, 2.8, x, y, 3, 2.6)));
const paws = [-4.6, 4.6].flatMap((x) => [-9.5, 7.5].map((y) => ellipsoid3(x, y + 1.2, 2.2, 3.4, 4.4, 2.2)));
// the page hangs from the snout: a slab, its lower corners cut steeply
const pageBox = roundBox3(0, 22, 16.6, 4.6, 1.5, 6.4, 0.5);
const page: D3 = (x, y, z) => Math.max(pageBox(x, y, z), (10.4 + 1.5 * Math.max(Math.abs(x) - 1.2, 0) - z) / 1.8);

const SPARKY = figure(
  [
    { d: body, color: CHROME },
    { d: collar, color: RED },
    ...legs.map((d) => ({ d, color: CHROME })),
    ...paws.map((d) => ({ d, color: CHROME })),
    // the head, the snout and its nose, the eyes, the ears
    { d: ellipsoid3(0, 13, 27.5, 7.6, 7.2, 7.4), color: CHROME },
    { d: roundBox3(0, 21.2, 25.2, 3.8, 3.6, 2.9, 2.9), color: CHROME },
    { d: sphere3(0, 24.6, 26.4, 1.7), color: INK },
    ...[-1, 1].map((s) => ({ d: sphere3(3.5 * s, 18.9, 30.6, 1.35), color: INK })),
    ...[-1, 1].map((s) => ({ d: roundCone3(5.4 * s, 11.5, 32.5, 2.7, 8.2 * s, 10.5, 40.5, 2), color: CHROME })),
    // the antenna tail and its red light
    { d: roundCone3(0, -12, 22, 2.1, 0, -16.8, 33, 1.6), color: CHROME },
    { d: sphere3(0, -17.2, 35, 2.6), color: RED },
    // the cover page of the science report, held by the mouth
    { d: page, color: PAPER },
    { d: roundBox3(0, 23.6, 18.4, 2.4, 0.4, 0.9, 0.2), color: DENIM },
  ],
  0.7,
);

export const sparkyDog = (): FieldTrinketInput => ({
  mm: SPARKY.mm,
  colorAt: SPARKY.colorAt,
  box: { min: [-11, -22, -0.5], max: [11, 30, 42] },
  bodyCell: 0.5,
  palette: [CHROME, RED, PAPER, INK],
});
