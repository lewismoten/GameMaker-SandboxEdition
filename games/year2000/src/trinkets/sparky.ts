// Sparky 3000, Dex's chrome robot dog, as the game draws him: a round-bellied chrome body on four legs with a red collar band,
// a head with a snout, two perked ears, a wagging antenna tail with a red light, and the cover page of Dex's science report
// hanging from his mouth. The belly is a keel at 45 degrees and the ears and antenna lean up, so he prints standing on his own
// feet without supports. Every slender part is at least 3 mm thick.
import { figure, ellipsoid3, roundCone3, scale3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import { roundBox3, sphere3, union3, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const CHROME: Rgb = [196, 208, 232];
const RED: Rgb = [226, 40, 48];
const PAPER: Rgb = [250, 242, 214];
const INK: Rgb = [28, 22, 44];
const DENIM: Rgb = [60, 96, 168];

// the torso: a rounded top over four stout legs. Two arches cut through the belly have steep gable roofs (70 degrees), so no support
const top = roundCone3(0, -7, 14.5, 6.6, 0, 6, 15, 7);
const legs = roundBox3(0, -0.5, 8, 5.7, 11, 8, 2.6);
const archSide: D3 = (_x, y, z) => Math.max(Math.abs(y + 1) * 2.7 + z - 8.4, -z - 1);
const archEnd: D3 = (x, _y, z) => Math.max(Math.abs(x) * 2.7 + z - 5.4, -z - 1);
const torso: D3 = (x, y, z) => Math.max(union3(top, legs)(x, y, z), -archSide(x, y, z), -archEnd(x, y, z));
// the collar band: a slice of the torso a little fatter than it
const band: D3 = (x, y, z) => Math.max(torso(x, y, z) - 0.55, Math.abs(y - 5.8) - 1.3, 9.5 - z);

// the page, hanging from the mouth: its lower corners are cut steeply
const pageBox = roundBox3(0, 20.2, 13, 3.8, 1.5, 5.2, 0.5);
const pageShape: D3 = (x, y, z) => Math.max(pageBox(x, y, z), (7.2 + 1.7 * Math.max(Math.abs(x) - 1.3, 0) - z) / 1.97);

const SPARKY = figure(
  [
    { d: torso, color: CHROME },
    { d: band, color: RED },
    { d: roundCone3(0, 6.5, 16, 5, 0, 10.5, 21, 4.6), color: CHROME },
    { d: ellipsoid3(0, 12, 22.4, 5.8, 5.6, 5.2), color: CHROME },
    { d: roundCone3(0, 8, 14, 5.6, 0, 13.4, 20, 4), color: CHROME },
    { d: roundCone3(0, 14.4, 22.4, 3.6, 0, 17.8, 16.6, 2.5), color: CHROME },
    { d: sphere3(0, 18.2, 16, 1.5), color: INK },
    ...[
      [-1, 0],
      [1, 0],
    ].map(([s]) => ({ d: sphere3(3.2 * s, 15.8, 24, 1.1), color: INK })),
    ...[1, -1].map((s) => ({ d: roundCone3(3.4 * s, 10.5, 24.5, 1.8, 5.4 * s, 9.5, 30.5, 1.5), color: CHROME })),
    { d: roundCone3(0, -9, 16.2, 1.8, 0, -13, 24.5, 1.6), color: CHROME },
    { d: sphere3(0, -13.6, 26, 2.5), color: RED },
    // the cover page of the science report, held by the mouth
    { d: pageShape, color: PAPER },
    { d: roundBox3(0, 21, 14.4, 2.2, 0.4, 0.8, 0.2), color: DENIM },
  ],
  0.7,
);
const BIG = 1.15;

export const sparkyDog = (): FieldTrinketInput => ({
  mm: scale3(SPARKY.mm, BIG),
  colorAt: (x, y, z) => SPARKY.colorAt(x / BIG, y / BIG, z / BIG),
  box: { min: [-10, -20, -0.5], max: [10, 30, 39] },
  bodyCell: 0.5,
  palette: [CHROME, RED, PAPER, INK],
});
