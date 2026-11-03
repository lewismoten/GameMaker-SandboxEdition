// The $89 shovel, lying flat: a wooden shaft, a D grip and a steel scoop with the price of a scoop raised in red on its blade.
// Everything stands straight up from the bed or is a half-round on it, so it prints without supports. The D grip takes a key ring.
import { figure, roundCone3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import { extrude, roundRect2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { strokeText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const WOOD: Rgb = [186, 134, 82];
const STEEL: Rgb = [176, 188, 206];
const GRIP: Rgb = [36, 40, 76];
const RED: Rgb = [244, 72, 60];

const outer = roundRect2(13.5, 12.5, 4, 0, 34);
const sides = (x: number, y: number) => Math.max(outer(x, y), -outer(x, y) - 2);
const price = strokeText2(['$1'], 10, 2, 0, 35);
const grip = (x: number, y: number) => Math.max(roundRect2(9, 6.5, 3.5, 0, -39)(x, y), -roundRect2(5.6, 3.2, 1.6, 0, -39)(x, y));

const SHOVEL = figure(
  [
    { d: roundCone3(0, -36, 1.7, 2.4, 0, 20, 1.7, 2.4), color: WOOD },
    { d: extrude(grip, 0, 5), color: GRIP },
    { d: roundCone3(0, 18, 1.8, 2.6, 0, 30, 0.7, 1), color: STEEL },
    { d: extrude(outer, 0, 1.8), color: STEEL },
    { d: extrude(sides, 0, 3.6), color: STEEL },
    { d: extrude(price, 0, 2.9), color: RED },
  ],
  0.4,
);

export const snowShovel = (): FieldTrinketInput => ({
  mm: SHOVEL.mm,
  colorAt: SHOVEL.colorAt,
  box: { min: [-16, -49, -0.5], max: [16, 50, 7] },
  bodyCell: 0.4,
  palette: [WOOD, STEEL, GRIP, RED],
});
