// The BLASTER nano-fighter itself, from the game's own ship sprite (ship.cbl): a steel delta with a long nose, twin guns,
// a cyan canopy and fins, red lights on the wingtips and the engine's orange flame. It lies flat on its belly on the bed.
import { figure, ellipsoid3, roundCone3, scale3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import { extrude, polygon2, roundBox3, sphere3, union3, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const STEEL: Rgb = [170, 180, 200];
const CYAN: Rgb = [40, 190, 240];
const RED: Rgb = [230, 30, 20];
const FIRE: Rgb = [255, 140, 30];

const wingPoly = polygon2([
  [0, 8],
  [24, -16],
  [24, -23],
  [0, -20],
  [-24, -23],
  [-24, -16],
]);
const wings: D3 = extrude((x, y) => wingPoly(x, y) - 0.7, 0, 3.2);
const both = (f: (s: number) => D3): D3 => union3(f(1), f(-1));

const SHIP = figure(
  [
    { d: ellipsoid3(0, 0, 0, 6.6, 27, 9.4), color: STEEL },
    { d: wings, color: STEEL },
    { d: both((s) => roundCone3(10 * s, -4, 1.6, 2.3, 10 * s, 21, 1.3, 1.9)), color: STEEL },
    { d: both((s) => sphere3(10 * s, 21.6, 1.3, 1.9)), color: CYAN },
    { d: ellipsoid3(0, 6, 5.4, 3.6, 8.5, 4.6), color: CYAN },
    { d: both((s) => roundBox3(21.2 * s, -19, 7, 1.4, 5.5, 7, 0.9)), color: CYAN },
    { d: both((s) => sphere3(21.8 * s, -15.6, 1.7, 2.4)), color: RED },
    { d: roundCone3(0, -24, 3.1, 4.4, 0, -30, 2.3, 3.3), color: STEEL },
    { d: roundCone3(0, -30, 2.2, 3.2, 0, -41, 0.65, 0.9), color: FIRE },
  ],
  0.8,
);
const BIG = 1.0;

export const blasterShip = (): FieldTrinketInput => ({
  mm: scale3(SHIP.mm, BIG),
  colorAt: SHIP.colorAt,
  box: { min: [-28, -45, -0.5], max: [28, 31, 16] },
  bodyCell: 0.8,
  palette: [STEEL, CYAN, RED, FIRE],
});
