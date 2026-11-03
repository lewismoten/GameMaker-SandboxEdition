// The trick dagger, lying flat: a bright, blunt gray blade (the prop that wasn't one in Act III), a gold guard, a black grip
// and a ring pommel with an exhibit tag number raised on the blade. Half-rounds and straight walls only: no supports.
import { figure, roundCone3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import { circle2, extrude, roundBox3, subtract3, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { strokeText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const STEEL: Rgb = [214, 220, 234];
const GOLD: Rgb = [226, 170, 40];
const BLACK: Rgb = [34, 30, 44];
const TAG: Rgb = [250, 244, 224];

const blade = roundCone3(0, -14, 1.6, 4.4, 0, 30, 1.3, 2.3);
const guard = roundBox3(0, -17, 1.7, 11, 2.4, 3.9, 1.4);
const grip = roundCone3(0, -20, 1.7, 2.7, 0, -32, 1.7, 2.9);
const pommel = subtract3(extrude(circle2(6.2, 0, -39), 0, 4.8), extrude(circle2(2.4, 0, -39), -1, 6));
// the exhibit tag's number, raised on the blade
const one = strokeText2(['1'], 7, 1.8, 0, 6);
const tag: D3 = (x, y, z) => Math.max(one(x, y), Math.abs(z - 3.2) - 3.2);

const DAGGER = figure(
  [
    { d: blade, color: STEEL },
    { d: tag, color: TAG },
    { d: guard, color: GOLD },
    { d: grip, color: BLACK },
    { d: pommel, color: GOLD },
  ],
  0.3,
);

export const trickDagger = (): FieldTrinketInput => ({
  mm: DAGGER.mm,
  colorAt: DAGGER.colorAt,
  box: { min: [-13, -47, -0.5], max: [13, 35, 7] },
  bodyCell: 0.3,
  palette: [STEEL, GOLD, BLACK, TAG],
});
