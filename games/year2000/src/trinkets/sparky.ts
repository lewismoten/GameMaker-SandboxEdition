// Sparky 3000, Dex's chrome robot dog, as the game draws him: a boxy body with a red band, a head with a snout, an antenna
// tail with a red light, and the cover page of Dex's science report hanging from his mouth. A tunnel under the belly
// has a pointed roof, so he prints standing on his own feet without supports.
import { figure, roundCone3, scale3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import { roundBox3, sphere3, union3, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const CHROME: Rgb = [196, 208, 232];
const RED: Rgb = [226, 40, 48];
const PAPER: Rgb = [250, 242, 214];
const INK: Rgb = [28, 22, 44];

const both = (f: (s: number) => D3): D3 => union3(f(1), f(-1));
const block = roundBox3(0, 3, 6.5, 6.8, 16, 10.5, 2.4);
// the tunnel under the belly, along x, its roof a steep gable
const tunnel: D3 = (_x, y, z) => Math.max(Math.abs(y + 1) * 1.5 + z - 8.2, -z - 1);
const aisle: D3 = (x, _y, z) => Math.max(Math.abs(x) * 1.9 + z - 7.4, -z - 1);
const belly: D3 = (x, y, z) => Math.max(block(x, y, z), -tunnel(x, y, z), -aisle(x, y, z));

const SPARKY = figure(
  [
    { d: belly, color: CHROME },
    { d: roundBox3(0, 8.6, 12.5, 7.1, 1.2, 4.7, 0.8), color: RED },
    { d: roundBox3(0, 12.6, 21.4, 5.8, 5.6, 5.2, 2.2), color: CHROME },
    { d: roundBox3(0, 18.6, 20.2, 3.6, 2.6, 2.4, 1), color: CHROME },
    { d: both((s) => sphere3(3 * s, 17.4, 23.4, 1.3)), color: INK },
    { d: roundCone3(0, -12.5, 14, 1.5, 0, -19.5, 25, 1.3), color: CHROME },
    { d: sphere3(0, -19.8, 25.6, 1.8), color: RED },
    { d: roundBox3(0, 20.3, 17.6, 2.8, 1, 3.6, 0.4), color: PAPER },
    { d: sphere3(0, 20.4, 18.4, 0.7), color: INK },
  ],
  0.6,
);
const BIG = 1.2;

export const sparkyDog = (): FieldTrinketInput => ({
  mm: scale3(SPARKY.mm, BIG),
  colorAt: (x, y, z) => SPARKY.colorAt(x / BIG, y / BIG, z / BIG),
  box: { min: [-10, -28, -0.5], max: [10, 31, 36] },
  bodyCell: 0.6,
  palette: [CHROME, RED, PAPER, INK],
});
