// The third goat at the manger: the hero goat's calm side pose, with horns, beard and muzzle, all four hooves joined into a low
// hay-lined manger plinth. The chunky, upward-facing parts keep it friendly and robust; the shared pipeline supplies supports for its belly overhang.
import { ellipsoid3, figure, roundCone3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';
import { roundBox3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';

const GOAT: Rgb = [148, 146, 148];
const CREAM: Rgb = [246, 244, 236];
const HORN: Rgb = [206, 180, 132];
const HAY: Rgb = [228, 184, 70];

const plinth = roundBox3(0, 0, 3, 31, 21, 3, 3);
const mangerFront = roundBox3(0, -15, 8, 28, 3, 4, 2);
const mangerBack = roundBox3(-12, 15, 7.5, 17, 2.5, 3.5, 1.8);

const body = ellipsoid3(-4, 0, 18, 15, 8.5, 11);
const neck = roundCone3(8, 0, 19, 7, 14, 0, 26, 5.5);
const head = ellipsoid3(19, 0, 29, 8, 6.4, 7.2);
const muzzle = ellipsoid3(25, -0.2, 27.7, 4.8, 5, 3.7);
const breast = ellipsoid3(8.5, -0.2, 20, 5.8, 6.2, 8.4);
const beard = roundCone3(21, 0, 25, 3.6, 17.5, 0, 19.5, 2.6);

const legs = [
  roundCone3(-13, -5.1, 5.5, 3.7, -10, -5.1, 17, 4.5),
  roundCone3(-4, 5.1, 5.5, 3.7, -2, 5.1, 17, 4.5),
  roundCone3(5, -5.1, 5.5, 3.7, 6, -5.1, 18, 4.4),
  roundCone3(11, 5.1, 5.5, 3.7, 9, 5.1, 19, 4.1),
];
const horns = [roundCone3(15.5, -3.6, 34, 3.2, 10.8, -4.1, 40, 2.1), roundCone3(15.5, 3.6, 34, 3.2, 10.8, 4.1, 40, 2.1)];
const ear = roundCone3(15, 5, 30.5, 2.9, 10, 8.5, 28.8, 2.3);
const tail = roundCone3(-17, 0, 21, 3.4, -23, 0, 25, 2.5);

const GOAT_AT_MANGER = figure(
  [
    { d: plinth, color: HAY },
    { d: mangerFront, color: HAY },
    { d: mangerBack, color: HAY },
    { d: body, color: GOAT },
    { d: neck, color: GOAT },
    { d: head, color: GOAT },
    { d: breast, color: CREAM },
    { d: muzzle, color: CREAM },
    { d: beard, color: CREAM },
    ...legs.map((d) => ({ d, color: GOAT })),
    ...horns.map((d) => ({ d, color: HORN })),
    { d: ear, color: GOAT },
    { d: tail, color: GOAT },
  ],
  1.4,
);

export const thirdGoatAtManger = (): FieldTrinketInput => ({
  mm: GOAT_AT_MANGER.mm,
  colorAt: GOAT_AT_MANGER.colorAt,
  box: { min: [-35, -24, -0.5], max: [31, 24, 43] },
  bodyCell: 0.6,
  palette: [GOAT, CREAM, HORN, HAY],
});
