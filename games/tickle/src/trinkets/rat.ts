// A white lab rat, tickled: lying on its belly with pink ears up, a pink nose and hind feet, and a long pink tail curled
// on the bed. The body is a half-dome, the tail lies flat, so it prints without supports.
import { ellipsoid3, figure, roundCone3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import { sphere3, union3, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const FUR: Rgb = [244, 242, 240];
const PINK: Rgb = [250, 150, 172];
const INK: Rgb = [30, 22, 34];

const both = (f: (s: number) => D3): D3 => union3(f(1), f(-1));
const TAIL: [number, number][] = [
  [0, -13],
  [1, -20],
  [5, -25],
  [11, -26],
  [16, -22],
  [17, -16],
];
const tail: D3 = union3(...TAIL.slice(1).map(([x, y], i) => roundCone3(TAIL[i][0], TAIL[i][1], 1, 1.5, x, y, 0.9, 1.3)));

const RAT = figure(
  [
    { d: ellipsoid3(0, -2, 0, 8.4, 13, 8), color: FUR },
    { d: ellipsoid3(0, 13.5, 0, 5.6, 6.4, 5.8), color: FUR },
    { d: roundCone3(0, 17, 2.4, 3.4, 0, 22.5, 1.5, 1.9), color: FUR },
    { d: sphere3(0, 23.6, 1.6, 1.7), color: PINK },
    { d: both((s) => ellipsoid3(4.6 * s, 11.6, 5, 1.4, 3.3, 3.9)), color: PINK },
    { d: both((s) => sphere3(2.9 * s, 18.3, 3.6, 1.15)), color: INK },
    { d: both((s) => ellipsoid3(6 * s, -9, 0.9, 2.3, 3.6, 1.4)), color: PINK },
    { d: both((s) => ellipsoid3(4 * s, 19.5, 0.8, 1.7, 2.4, 1.1)), color: PINK },
    { d: tail, color: PINK },
  ],
  0.7,
);

export const labRat = (): FieldTrinketInput => ({
  mm: RAT.mm,
  colorAt: RAT.colorAt,
  box: { min: [-14, -30, -0.5], max: [22, 28, 12] },
  bodyCell: 0.5,
  palette: [FUR, PINK, INK],
});
