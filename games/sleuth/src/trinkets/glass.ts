// Inspector Ada Penn's prop magnifying glass, lying flat: a brass rim round a pale lens (a thin disc that fills it), a black
// handle with a brass ferrule and a ring hole at the end. Everything stands straight up from the bed or is a half-round on it,
// so it prints without supports.
import { figure, roundCone3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import { circle2, extrude, subtract3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const BRASS: Rgb = [226, 170, 40];
const GLASS: Rgb = [176, 224, 240];
const BLACK: Rgb = [34, 30, 44];

const CY = 14;
const rim = extrude((x, y) => Math.max(Math.hypot(x, y - CY) - 17, 13.4 - Math.hypot(x, y - CY)), 0, 5);
const lens = extrude(circle2(14, 0, CY), 0, 2.2);
const handle = roundCone3(0, -4, 1.7, 3.4, 0, -34, 1.7, 3.1);
const ferrule = roundCone3(0, -2, 1.7, 3.9, 0, -9, 1.7, 3.9);
const end = subtract3(extrude(circle2(6.2, 0, -39), 0, 5), extrude(circle2(2.4, 0, -39), -1, 6));

const GLASS_FIG = figure(
  [
    { d: rim, color: BRASS },
    { d: lens, color: GLASS },
    { d: handle, color: BLACK },
    { d: ferrule, color: BRASS },
    { d: end, color: BLACK },
  ],
  0.3,
);

export const adaGlass = (): FieldTrinketInput => ({
  mm: GLASS_FIG.mm,
  colorAt: GLASS_FIG.colorAt,
  box: { min: [-19, -47, -0.5], max: [19, 34, 7] },
  bodyCell: 0.4,
  palette: [BRASS, GLASS, BLACK],
});
