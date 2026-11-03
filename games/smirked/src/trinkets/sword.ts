// The $12 foam sword, lying flat: a gray foam blade with the price raised in red, a yellow guard, a red grip and a pommel with a
// ring hole. Everything is a half-round or stands straight up from the bed, so it prints without supports, and every part
// is over 4 mm thick.
import { figure, roundCone3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import { circle2, extrude, roundBox3, subtract3, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { strokeText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const FOAM: Rgb = [190, 196, 208];
const YELLOW: Rgb = [244, 200, 24];
const RED: Rgb = [226, 40, 48];

const price = strokeText2(['$12'], 4.6, 1.2);
// the price runs along the blade, tip toward the top of its letters
const priceBlade: D3 = (x, y, z) => Math.max(price(y - 20, -x), Math.abs(z - 2.7) - 2.7);
const pommel = subtract3(extrude(circle2(6.2, 0, -50), 0, 4.4), extrude(circle2(2.4, 0, -50), -1, 6));

const SWORD = figure(
  [
    { d: roundBox3(0, 9, 1.2, 4.6, 38, 3.4, 2), color: FOAM },
    { d: priceBlade, color: RED },
    { d: roundBox3(0, -29.5, 1.7, 13, 2.4, 3.9, 1.4), color: YELLOW },
    { d: roundCone3(0, -33, 1.8, 2.5, 0, -46, 1.8, 2.5), color: RED },
    { d: pommel, color: YELLOW },
  ],
  0.3,
);

export const foamSword = (): FieldTrinketInput => ({
  mm: SWORD.mm,
  colorAt: SWORD.colorAt,
  box: { min: [-15, -58, -0.5], max: [15, 51, 7] },
  bodyCell: 0.4,
  palette: [FOAM, YELLOW, RED],
});
